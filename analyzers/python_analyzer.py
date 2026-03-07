# analyzers/python_analyzer.py
import ast
import tokenize
import io
import py_compile
import tempfile
import os
import re
import sys
from typing import List, Dict, Any, Tuple, Set
from .base_analyzer import BaseAnalyzer

class PythonAnalyzer(BaseAnalyzer):
    """
    Enhanced Python analyzer that detects ALL possible syntax errors,
    logical errors, and style issues.
    """
    
    def analyze(self, code: str) -> Dict[str, Any]:
        errors = []
        warnings = []
        info = []
        
        # Multiple analysis passes to catch different types of issues
        analysis_methods = [
            self.check_encoding,
            self.check_syntax_structure,
            self.check_tokens,
            self.check_ast,
            self.check_compilation,
            self.check_indentation,
            self.check_common_pitfalls,
            self.check_pep8,
            self.check_logical_errors,
            self.check_unreachable_code,
            self.check_name_errors,
            self.check_type_hints,
            self.check_imports,
            self.check_async_syntax,
            self.check_f_strings,
            self.check_walrus_operator,
            self.check_pattern_matching,  # Python 3.10+
            self.check_exception_handling,
            self.check_resource_management,
            self.check_comparisons,
        ]
        
        for method in analysis_methods:
            try:
                method_errors, method_warnings, method_info = method(code)
                errors.extend(method_errors)
                warnings.extend(method_warnings)
                info.extend(method_info)
            except Exception as e:
                # Log internal error but don't crash
                warnings.append({
                    'line': 1,
                    'column': 0,
                    'message': f"Internal analyzer error in {method.__name__}: {str(e)}",
                    'type': 'analyzer_error',
                    'severity': 'low'
                })
        
        # Remove duplicates while preserving order
        errors = self.deduplicate_errors(errors)
        warnings = self.deduplicate_warnings(warnings)
        info = self.deduplicate_info(info)
        
        # Sort by line number
        errors.sort(key=lambda x: x['line'])
        warnings.sort(key=lambda x: x['line'])
        info.sort(key=lambda x: x['line'])
        
        return self.format_result(errors, warnings, info)
    
    def check_encoding(self, code: str) -> Tuple[List, List, List]:
        """Check for encoding issues"""
        errors = []
        warnings = []
        info = []
        
        # Check for BOM
        if code.startswith('\ufeff'):
            info.append({
                'line': 1,
                'column': 0,
                'message': "File contains UTF-8 BOM",
                'type': 'encoding_info',
                'severity': 'low'
            })
        
        # Check for invalid encoding
        try:
            code.encode('utf-8')
        except UnicodeEncodeError as e:
            errors.append({
                'line': 1,
                'column': e.start,
                'message': f"Invalid UTF-8 encoding: {str(e)}",
                'type': 'encoding_error',
                'severity': 'high'
            })
        
        return errors, warnings, info
    
    def check_syntax_structure(self, code: str) -> Tuple[List, List, List]:
        """Check overall syntax structure"""
        errors = []
        warnings = []
        info = []
        lines = code.split('\n')
        
        # Check for mismatched brackets/parentheses
        stack = []
        brackets = {'(': ')', '[': ']', '{': '}'}
        positions = []
        
        for i, line in enumerate(lines, 1):
            for j, char in enumerate(line):
                if char in brackets:
                    stack.append(char)
                    positions.append((i, j))
                elif char in brackets.values():
                    if not stack:
                        errors.append({
                            'line': i,
                            'column': j,
                            'message': f"Closing bracket '{char}' without opening",
                            'type': 'syntax_error',
                            'severity': 'high'
                        })
                    else:
                        last_open = stack[-1]
                        if brackets[last_open] != char:
                            open_line, open_col = positions[-1]
                            errors.append({
                                'line': i,
                                'column': j,
                                'message': f"Mismatched bracket: expected '{brackets[last_open]}' but found '{char}' (opened at line {open_line})",
                                'type': 'syntax_error',
                                'severity': 'high'
                            })
                        else:
                            stack.pop()
                            positions.pop()
        
        # Unclosed brackets
        for bracket, pos in zip(stack, positions):
            errors.append({
                'line': pos[0],
                'column': pos[1],
                'message': f"Unclosed bracket '{bracket}'",
                'type': 'syntax_error',
                'severity': 'high'
            })
        
        return errors, warnings, info
    
    def check_tokens(self, code: str) -> Tuple[List, List, List]:
        """Check using Python tokenizer - catches many errors"""
        errors = []
        warnings = []
        info = []
        
        try:
            tokens = list(tokenize.generate_tokens(io.StringIO(code).readline))
            
            for i, token in enumerate(tokens):
                # ERRORTOKEN indicates invalid token
                if token.type == tokenize.ERRORTOKEN:
                    errors.append({
                        'line': token.start[0],
                        'column': token.start[1],
                        'message': f"Invalid token: '{token.string}'",
                        'type': 'token_error',
                        'severity': 'high'
                    })
                
                # Check for unterminated strings (multiple lines)
                if token.type == tokenize.STRING:
                    string_content = token.string
                    # Check for f-string issues
                    if string_content.startswith(('f"', "f'", 'F"', "F'")):
                        self._check_fstring_errors(token, errors)
                    
                    # Check for raw string issues
                    if string_content.startswith(('r"', "r'", 'R"', "R'")):
                        if '\\' in string_content and not string_content.endswith('\\'):
                            # Raw strings handle backslashes differently
                            pass
                
                # Check for indentation errors
                if token.type == tokenize.INDENT:
                    if token.start[1] % 4 != 0:
                        warnings.append({
                            'line': token.start[0],
                            'column': token.start[1],
                            'message': "Indentation not multiple of 4 spaces",
                            'type': 'indentation_warning',
                            'severity': 'low'
                        })
                
                # Check for inconsistent indentation
                if token.type == tokenize.DEDENT:
                    # Could track indentation levels here
                    pass
        
        except tokenize.TokenError as e:
            line_match = re.search(r'line (\d+)', str(e))
            line = int(line_match.group(1)) if line_match else 1
            errors.append({
                'line': line,
                'column': 0,
                'message': str(e),
                'type': 'token_error',
                'severity': 'high'
            })
        
        return errors, warnings, info
    
    def _check_fstring_errors(self, token, errors):
        """Check for common f-string errors"""
        content = token.string
        line = token.start[0]
        col = token.start[1]
        
        # Check for nested quotes
        if content.count('"') > 2 or content.count("'") > 2:
            if '{{' not in content and '}}' not in content:
                errors.append({
                    'line': line,
                    'column': col,
                    'message': "Possible nested quotes in f-string - use different quote types",
                    'type': 'fstring_error',
                    'severity': 'medium'
                })
        
        # Check for unescaped braces
        brace_count = content.count('{') - content.count('{{') * 2
        if brace_count > 0 and '}' not in content:
            errors.append({
                'line': line,
                'column': col,
                'message': "Unclosed expression in f-string",
                'type': 'fstring_error',
                'severity': 'high'
            })
    
    def check_ast(self, code: str) -> Tuple[List, List, List]:
        """Check using AST - finds structural errors"""
        errors = []
        warnings = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            # Walk through all nodes
            for node in ast.walk(tree):
                self._check_node_errors(node, errors, warnings)
                
        except SyntaxError as e:
            errors.append({
                'line': e.lineno or 1,
                'column': e.offset or 0,
                'message': str(e),
                'type': 'syntax_error',
                'severity': 'high'
            })
            
            # Try to find more errors in chunks
            more_errors = self._check_code_chunks(code, e.lineno or 1)
            errors.extend(more_errors)
        
        return errors, warnings, info
    
    def _check_node_errors(self, node, errors, warnings):
        """Check individual AST nodes for issues"""
        
        # Function definitions
        if isinstance(node, ast.FunctionDef):
            # Empty function
            if not node.body:
                warnings.append({
                    'line': node.lineno,
                    'column': node.col_offset,
                    'message': f"Function '{node.name}' has no body (contains only 'pass')",
                    'type': 'structure_warning',
                    'severity': 'low'
                })
            
            # Missing return type hint
            if not node.returns and node.name != '__init__':
                warnings.append({
                    'line': node.lineno,
                    'column': node.col_offset,
                    'message': f"Function '{node.name}' missing return type hint",
                    'type': 'type_hint_warning',
                    'severity': 'low'
                })
            
            # Mutable default arguments
            for arg in node.args.defaults:
                if isinstance(arg, (ast.List, ast.Dict, ast.Set)):
                    warnings.append({
                        'line': arg.lineno,
                        'column': arg.col_offset,
                        'message': "Mutable default argument - can cause unexpected behavior",
                        'type': 'mutable_default_warning',
                        'severity': 'medium'
                    })
        
        # Class definitions
        elif isinstance(node, ast.ClassDef):
            if not node.body:
                warnings.append({
                    'line': node.lineno,
                    'column': node.col_offset,
                    'message': f"Class '{node.name}' has no body",
                    'type': 'structure_warning',
                    'severity': 'low'
                })
            
            # Missing docstring
            if not ast.get_docstring(node):
                warnings.append({
                    'line': node.lineno,
                    'column': node.col_offset,
                    'message': f"Class '{node.name}' missing docstring",
                    'type': 'documentation_warning',
                    'severity': 'low'
                })
        
        # Return statements
        elif isinstance(node, ast.Return):
            parent = getattr(node, 'parent', None)
            if parent and isinstance(parent, ast.FunctionDef):
                if parent.name == '__init__' and node.value:
                    errors.append({
                        'line': node.lineno,
                        'column': node.col_offset,
                        'message': "__init__ should not return a value",
                        'type': 'init_return_error',
                        'severity': 'high'
                    })
        
        # Comparisons
        elif isinstance(node, ast.Compare):
            # Check for 'is' with literal
            for op in node.ops:
                if isinstance(op, ast.Is) or isinstance(op, ast.IsNot):
                    for comp in node.comparators:
                        if isinstance(comp, (ast.Constant, ast.Num, ast.Str)):
                            if not isinstance(comp, ast.Constant) or comp.value is not None:
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': "Use '==' for value comparison with literals, not 'is'",
                                    'type': 'comparison_warning',
                                    'severity': 'medium'
                                })
        
        # Try blocks
        elif isinstance(node, ast.Try):
            # Bare except
            for handler in node.handlers:
                if handler.type is None:
                    warnings.append({
                        'line': handler.lineno,
                        'column': handler.col_offset,
                        'message': "Bare except clause - catches all exceptions including KeyboardInterrupt",
                        'type': 'exception_warning',
                        'severity': 'medium'
                    })
    
    def _check_code_chunks(self, code: str, error_line: int) -> List[Dict[str, Any]]:
        """Check code in chunks to find more errors after the first one"""
        errors = []
        lines = code.split('\n')
        
        # Check code before the error line
        if error_line > 1:
            before_code = '\n'.join(lines[:error_line-1])
            try:
                ast.parse(before_code)
            except SyntaxError as e:
                errors.append({
                    'line': e.lineno or 1,
                    'column': e.offset or 0,
                    'message': f"Before error: {str(e)}",
                    'type': 'syntax_error',
                    'severity': 'high'
                })
        
        # Check code after the error line
        if error_line < len(lines):
            after_code = '\n'.join(lines[error_line:])
            try:
                ast.parse(after_code)
            except SyntaxError as e:
                actual_line = error_line + (e.lineno or 1) - 1
                errors.append({
                    'line': actual_line,
                    'column': e.offset or 0,
                    'message': f"After error: {str(e)}",
                    'type': 'syntax_error',
                    'severity': 'high'
                })
        
        return errors
    
    def check_compilation(self, code: str) -> Tuple[List, List, List]:
        """Check by attempting to compile the code"""
        errors = []
        warnings = []
        info = []
        
        try:
            compile(code, '<string>', 'exec')
        except SyntaxError as e:
            # This catches the first error, others caught elsewhere
            pass
        except MemoryError:
            errors.append({
                'line': 1,
                'column': 0,
                'message': "Code too large to compile",
                'type': 'compilation_error',
                'severity': 'high'
            })
        except Exception as e:
            errors.append({
                'line': 1,
                'column': 0,
                'message': f"Compilation error: {str(e)}",
                'type': 'compilation_error',
                'severity': 'high'
            })
        
        return errors, warnings, info
    
    def check_indentation(self, code: str) -> Tuple[List, List, List]:
        """Check for indentation errors and inconsistencies"""
        errors = []
        warnings = []
        info = []
        lines = code.split('\n')
        
        indent_levels = []
        expected_indent = 0
        
        for i, line in enumerate(lines, 1):
            if not line.strip() or line.strip().startswith('#'):
                continue
            
            # Calculate indentation
            indent = len(line) - len(line.lstrip())
            indent_chars = line[:indent]
            
            # Check for mixed tabs and spaces
            if '\t' in indent_chars and ' ' in indent_chars:
                errors.append({
                    'line': i,
                    'column': 0,
                    'message': "Mixed tabs and spaces in indentation",
                    'type': 'indentation_error',
                    'severity': 'high'
                })
            
            # Check for inconsistent indentation
            stripped = line.strip()
            
            # Check indentation for block starters
            if stripped.endswith(':'):
                if i < len(lines):
                    next_line = lines[i].strip()
                    if next_line and not next_line.startswith((')', ']', '}')):
                        next_indent = len(lines[i]) - len(lines[i].lstrip())
                        if next_indent <= indent:
                            errors.append({
                                'line': i + 1,
                                'column': 0,
                                'message': "Expected indented block",
                                'type': 'indentation_error',
                                'severity': 'high'
                            })
            
            # Track indentation levels
            if indent_levels:
                last_level = indent_levels[-1]
                if indent > last_level:
                    if indent - last_level not in [4, 8, 12, 16]:
                        warnings.append({
                            'line': i,
                            'column': 0,
                            'message': f"Indentation increased by {indent - last_level} spaces (expected multiple of 4)",
                            'type': 'indentation_warning',
                            'severity': 'low'
                        })
            
            indent_levels.append(indent)
        
        return errors, warnings, info
    
    def check_common_pitfalls(self, code: str) -> Tuple[List, List, List]:
        """Check for common Python mistakes"""
        errors = []
        warnings = []
        info = []
        
        # Use AST for more accurate checking
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Check for '==' None
                if isinstance(node, ast.Compare):
                    for op, comp in zip(node.ops, node.comparators):
                        if isinstance(op, (ast.Eq, ast.NotEq)):
                            if isinstance(comp, ast.Constant) and comp.value is None:
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': "Use 'is None' / 'is not None' instead of '== None' / '!= None'",
                                    'type': 'comparison_warning',
                                    'severity': 'medium'
                                })
                
                # Check for mutable default args
                if isinstance(node, ast.FunctionDef):
                    for default in node.args.defaults:
                        if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                            warnings.append({
                                'line': default.lineno,
                                'column': default.col_offset,
                                'message': f"Mutable default argument in function '{node.name}'",
                                'type': 'mutable_default_warning',
                                'severity': 'medium'
                            })
                
                # Check for bare except
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    warnings.append({
                        'line': node.lineno,
                        'column': node.col_offset,
                        'message': "Bare except clause - catches all exceptions",
                        'type': 'exception_warning',
                        'severity': 'medium'
                    })
                
                # Check for unused variables (simplified)
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    # This is a simplified check - would need full scope analysis
                    pass
                
                # Check for dangerous default values
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id == 'eval':
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Use of eval() can be dangerous - consider alternatives",
                                'type': 'security_warning',
                                'severity': 'medium'
                            })
                        elif node.func.id == 'exec':
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Use of exec() can be dangerous - consider alternatives",
                                'type': 'security_warning',
                                'severity': 'medium'
                            })
        
        except SyntaxError:
            # Will be caught by other methods
            pass
        
        return errors, warnings, info
    
    def check_pep8(self, code: str) -> Tuple[List, List, List]:
        """PEP 8 style checking"""
        warnings = []
        info = []
        errors = []
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Line length
            if len(line) > 79:
                warnings.append({
                    'line': i,
                    'column': 79,
                    'message': f"Line too long ({len(line)} > 79 characters)",
                    'type': 'pep8_warning',
                    'severity': 'low'
                })
            
            # Trailing whitespace
            if line.rstrip() != line:
                warnings.append({
                    'line': i,
                    'column': len(line.rstrip()),
                    'message': "Trailing whitespace",
                    'type': 'pep8_warning',
                    'severity': 'low'
                })
            
            # Multiple statements on one line
            if ';' in line and not line.strip().startswith('#'):
                warnings.append({
                    'line': i,
                    'column': line.find(';'),
                    'message': "Multiple statements on one line",
                    'type': 'pep8_warning',
                    'severity': 'low'
                })
            
            # Missing whitespace after comma
            for match in re.finditer(r',[^\s]', line):
                if not self._in_string_or_comment(line, match.start()):
                    warnings.append({
                        'line': i,
                        'column': match.start() + 1,
                        'message': "Missing whitespace after comma",
                        'type': 'pep8_warning',
                        'severity': 'low'
                    })
            
            # Missing whitespace around operators
            operators = ['=', '==', '!=', '<=', '>=', '+', '-', '*', '/', '//', '%', '**']
            for op in operators:
                for match in re.finditer(re.escape(op), line):
                    pos = match.start()
                    if not self._in_string_or_comment(line, pos):
                        if op == '**':
                            # Special handling for exponentiation
                            continue
                        # Check if surrounded by spaces
                        before = pos > 0 and line[pos-1].isspace()
                        after = pos + len(op) < len(line) and line[pos + len(op)].isspace()
                        if not (before and after):
                            warnings.append({
                                'line': i,
                                'column': pos,
                                'message': f"Missing whitespace around operator '{op}'",
                                'type': 'pep8_warning',
                                'severity': 'low'
                            })
            
            # Blank line issues
            if i > 1 and not line.strip() and not lines[i-2].strip():
                warnings.append({
                    'line': i,
                    'column': 0,
                    'message': "Multiple blank lines",
                    'type': 'pep8_warning',
                    'severity': 'low'
                })
        
        return errors, warnings, info
    
    def check_logical_errors(self, code: str) -> Tuple[List, List, List]:
        """Check for logical errors"""
        errors = []
        warnings = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Check for pointless comparisons
                if isinstance(node, ast.Compare):
                    for left, op, right in zip([node.left] * len(node.ops), node.ops, node.comparators):
                        if isinstance(left, ast.Constant) and isinstance(right, ast.Constant):
                            if isinstance(left.value, (int, float)) and isinstance(right.value, (int, float)):
                                if isinstance(op, ast.Eq) and left.value == right.value:
                                    warnings.append({
                                        'line': node.lineno,
                                        'column': node.col_offset,
                                        'message': "Pointless comparison: comparing identical values",
                                        'type': 'logical_warning',
                                        'severity': 'low'
                                    })
                
                # Check for if True: or if False:
                if isinstance(node, ast.If):
                    if isinstance(node.test, ast.Constant):
                        if node.test.value is True:
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Condition is always True",
                                'type': 'logical_warning',
                                'severity': 'low'
                            })
                        elif node.test.value is False:
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Condition is always False - code will never execute",
                                'type': 'logical_warning',
                                'severity': 'medium'
                            })
                
                # Check for while True: without break
                if isinstance(node, ast.While):
                    if isinstance(node.test, ast.Constant) and node.test.value is True:
                        has_break = any(isinstance(n, ast.Break) for n in ast.walk(node))
                        if not has_break:
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "while True: loop without break - may be infinite",
                                'type': 'logical_warning',
                                'severity': 'medium'
                            })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_unreachable_code(self, code: str) -> Tuple[List, List, List]:
        """Check for unreachable code"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.If, ast.While, ast.For)):
                    # Check for code after return/break/continue
                    body = node.body
                    for i, stmt in enumerate(body):
                        if isinstance(stmt, (ast.Return, ast.Raise, ast.Break, ast.Continue)):
                            if i < len(body) - 1:
                                for unreachable in body[i+1:]:
                                    if not isinstance(unreachable, ast.Pass):
                                        warnings.append({
                                            'line': unreachable.lineno,
                                            'column': unreachable.col_offset,
                                            'message': "Unreachable code after return/break/continue",
                                            'type': 'unreachable_warning',
                                            'severity': 'medium'
                                        })
                                break
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_name_errors(self, code: str) -> Tuple[List, List, List]:
        """Check for name errors (undefined variables)"""
        errors = []
        warnings = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            # Simple scope tracking
            defined_names = set()
            used_names = set()
            
            # Built-in names
            builtins = dir(__builtins__)
            defined_names.update(builtins)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Name):
                    if isinstance(node.ctx, ast.Store):
                        defined_names.add(node.id)
                    elif isinstance(node.ctx, ast.Load):
                        used_names.add(node.id)
                
                # Function definitions add their parameters
                if isinstance(node, ast.FunctionDef):
                    defined_names.add(node.name)
                    for arg in node.args.args:
                        defined_names.add(arg.arg)
                    for arg in node.args.kwarg or []:
                        if arg:
                            defined_names.add(arg.arg)
                    for arg in node.args.vararg or []:
                        if arg:
                            defined_names.add(arg.arg)
                
                # Class definitions
                if isinstance(node, ast.ClassDef):
                    defined_names.add(node.name)
                
                # Import statements
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        defined_names.add(alias.asname or alias.name)
                elif isinstance(node, ast.ImportFrom):
                    for alias in node.names:
                        defined_names.add(alias.asname or alias.name)
            
            # Check for undefined names
            for name in used_names:
                if name not in defined_names and name not in ['self', 'cls']:
                    warnings.append({
                        'line': 1,  # Would need to find actual usage line
                        'column': 0,
                        'message': f"Possible undefined name: '{name}'",
                        'type': 'name_warning',
                        'severity': 'medium'
                    })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_type_hints(self, code: str) -> Tuple[List, List, List]:
        """Check for type hint issues"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Check return type hint syntax
                    if node.returns:
                        self._check_type_hint_node(node.returns, warnings)
                    
                    # Check parameter type hints
                    for arg in node.args.args:
                        if arg.annotation:
                            self._check_type_hint_node(arg.annotation, warnings)
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def _check_type_hint_node(self, node, warnings):
        """Check individual type hint nodes"""
        # Check for string type hints that might be undefined
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            # Forward references are okay
            pass
        
        # Check for undefined types (simplified)
        if isinstance(node, ast.Name):
            if node.id not in ['int', 'str', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'Any', 'Optional', 'Union']:
                warnings.append({
                    'line': node.lineno,
                    'column': node.col_offset,
                    'message': f"Type hint '{node.id}' may be undefined",
                    'type': 'type_hint_warning',
                    'severity': 'low'
                })
    
    def check_imports(self, code: str) -> Tuple[List, List, List]:
        """Check for import issues"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            imports = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
                    
                    # Check for relative imports beyond top level
                    if node.level > 2:
                        warnings.append({
                            'line': node.lineno,
                            'column': node.col_offset,
                            'message': f"Relative import with level {node.level} - may be too deep",
                            'type': 'import_warning',
                            'severity': 'low'
                        })
            
            # Check for duplicate imports
            if len(imports) != len(set(imports)):
                warnings.append({
                    'line': 1,
                    'column': 0,
                    'message': "Duplicate imports found",
                    'type': 'import_warning',
                    'severity': 'low'
                })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_async_syntax(self, code: str) -> Tuple[List, List, List]:
        """Check async/await syntax"""
        errors = []
        warnings = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.AsyncFunctionDef):
                    # Check for await in non-async function
                    for child in ast.walk(node):
                        if isinstance(child, ast.Await):
                            # This is fine since we're in async function
                            pass
                
                elif isinstance(node, ast.FunctionDef):
                    # Check for await in regular function
                    for child in ast.walk(node):
                        if isinstance(child, ast.Await):
                            errors.append({
                                'line': child.lineno,
                                'column': child.col_offset,
                                'message': "'await' outside async function",
                                'type': 'async_error',
                                'severity': 'high'
                            })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_f_strings(self, code: str) -> Tuple[List, List, List]:
        """Check f-string syntax"""
        errors = []
        warnings = []
        info = []
        
        # Check Python version compatibility
        if sys.version_info < (3, 6):
            if 'f"' in code or "f'" in code:
                errors.append({
                    'line': 1,
                    'column': 0,
                    'message': "f-strings require Python 3.6+",
                    'type': 'version_error',
                    'severity': 'high'
                })
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.JoinedStr):
                    for value in node.values:
                        if isinstance(value, ast.FormattedValue):
                            # Check for empty expression
                            if value.value is None:
                                errors.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': "Empty expression in f-string",
                                    'type': 'fstring_error',
                                    'severity': 'high'
                                })
                            
                            # Check for invalid conversion flags
                            if value.conversion not in [-1, 114, 115, 97, 114]:  # -1, 'r', 's', 'a', '!r', '!s', '!a'
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': f"Invalid conversion flag in f-string: {chr(value.conversion) if value.conversion > 0 else value.conversion}",
                                    'type': 'fstring_warning',
                                    'severity': 'medium'
                                })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_walrus_operator(self, code: str) -> Tuple[List, List, List]:
        """Check walrus operator (:=) usage"""
        warnings = []
        errors = []
        info = []
        
        # Check Python version
        if sys.version_info < (3, 8):
            if ':=' in code:
                errors.append({
                    'line': 1,
                    'column': 0,
                    'message': "Walrus operator (:=) requires Python 3.8+",
                    'type': 'version_error',
                    'severity': 'high'
                })
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.NamedExpr):
                    # Check for walrus in invalid contexts
                    parent = getattr(node, 'parent', None)
                    if parent:
                        if isinstance(parent, ast.Expr):
                            # Standalone assignment expression is invalid
                            errors.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Assignment expression cannot be used as a standalone statement",
                                'type': 'walrus_error',
                                'severity': 'high'
                            })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_pattern_matching(self, code: str) -> Tuple[List, List, List]:
        """Check structural pattern matching (Python 3.10+)"""
        warnings = []
        errors = []
        info = []
        
        # Check Python version
        if sys.version_info < (3, 10):
            if 'match ' in code and 'case ' in code:
                info.append({
                    'line': 1,
                    'column': 0,
                    'message': "Structural pattern matching (match/case) requires Python 3.10+",
                    'type': 'version_info',
                    'severity': 'low'
                })
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Match):
                    # Check for empty match
                    if not node.cases:
                        warnings.append({
                            'line': node.lineno,
                            'column': node.col_offset,
                            'message': "Empty match statement",
                            'type': 'pattern_warning',
                            'severity': 'low'
                        })
                    
                    # Check for missing default case
                    has_default = any(
                        isinstance(case.pattern, ast.MatchAs) and case.pattern.name is None
                        for case in node.cases
                    )
                    if not has_default:
                        warnings.append({
                            'line': node.lineno,
                            'column': node.col_offset,
                            'message': "Match statement without default case (wildcard)",
                            'type': 'pattern_warning',
                            'severity': 'low'
                        })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_exception_handling(self, code: str) -> Tuple[List, List, List]:
        """Check exception handling issues"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Raise):
                    # Check for raise from None pattern
                    if node.cause:
                        if isinstance(node.cause, ast.Constant) and node.cause.value is None:
                            # This is okay - raise ... from None
                            pass
                
                elif isinstance(node, ast.ExceptHandler):
                    # Check for too broad exceptions
                    if node.type:
                        if isinstance(node.type, ast.Name):
                            if node.type.id == 'Exception':
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': "Catching too broad exception 'Exception'",
                                    'type': 'exception_warning',
                                    'severity': 'low'
                                })
                            elif node.type.id in ['BaseException', 'SystemExit', 'KeyboardInterrupt']:
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': f"Catching '{node.type.id}' may prevent clean shutdown",
                                    'type': 'exception_warning',
                                    'severity': 'medium'
                                })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_resource_management(self, code: str) -> Tuple[List, List, List]:
        """Check resource management (files, connections)"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Check for file opens without context manager
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id == 'open':
                            # Check if this open is used in a with statement
                            parent = getattr(node, 'parent', None)
                            if not isinstance(parent, ast.With):
                                warnings.append({
                                    'line': node.lineno,
                                    'column': node.col_offset,
                                    'message': "File opened without context manager (use 'with' statement)",
                                    'type': 'resource_warning',
                                    'severity': 'medium'
                                })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def check_comparisons(self, code: str) -> Tuple[List, List, List]:
        """Check comparison issues"""
        warnings = []
        errors = []
        info = []
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Compare):
                    # Check for chained comparisons that might be confusing
                    if len(node.ops) > 1:
                        warnings.append({
                            'line': node.lineno,
                            'column': node.col_offset,
                            'message': "Chained comparison - ensure operator precedence is clear",
                            'type': 'comparison_warning',
                            'severity': 'low'
                        })
                    
                    # Check for comparisons with True/False
                    for comp in node.comparators:
                        if isinstance(comp, ast.Constant) and comp.value in [True, False]:
                            warnings.append({
                                'line': node.lineno,
                                'column': node.col_offset,
                                'message': "Unnecessary comparison to True/False",
                                'type': 'comparison_warning',
                                'severity': 'low'
                            })
        
        except SyntaxError:
            pass
        
        return errors, warnings, info
    
    def _in_string_or_comment(self, line: str, position: int) -> bool:
        """Check if a position in a line is inside a string or comment"""
        # Check for comment
        comment_pos = line.find('#')
        if comment_pos != -1 and comment_pos < position:
            return True
        
        # Check for strings (simplified)
        in_string = False
        string_char = None
        escaped = False
        
        for i, char in enumerate(line[:position + 1]):
            if escaped:
                escaped = False
                continue
            
            if char == '\\':
                escaped = True
            elif char in ['"', "'"]:
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char and not escaped:
                    in_string = False
        
        return in_string
    
    def deduplicate_errors(self, errors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate errors"""
        seen = set()
        unique = []
        
        for error in errors:
            key = (error['line'], error['column'], error['message'])
            if key not in seen:
                seen.add(key)
                unique.append(error)
        
        return unique
    
    def deduplicate_warnings(self, warnings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate warnings"""
        seen = set()
        unique = []
        
        for warning in warnings:
            key = (warning['line'], warning['column'], warning['message'])
            if key not in seen:
                seen.add(key)
                unique.append(warning)
        
        return unique
    
    def deduplicate_info(self, info: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate info messages"""
        seen = set()
        unique = []
        
        for msg in info:
            key = (msg['line'], msg['column'], msg['message'])
            if key not in seen:
                seen.add(key)
                unique.append(msg)
        
        return unique
    
    def format_result(self, errors: List[Dict], warnings: List[Dict], info: List[Dict]) -> Dict[str, Any]:
        """Format the analysis result"""
        return {
            'errors': errors,
            'warnings': warnings,
            'info': info,
            'error_count': len(errors),
            'warning_count': len(warnings),
            'info_count': len(info),
            'valid': len(errors) == 0
        }