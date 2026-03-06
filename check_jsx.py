
import re

def check_jsx_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    div_stack = []
    nav_stack = []
    header_stack = []
    frag_stack = []
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        opens = re.findall(r'<div|<nav|<header|<>', line)
        closes = re.findall(r'</div|</nav|</header|</>', line)
        
        for tag in opens:
            if tag == '<div': div_stack.append(line_num)
            if tag == '<nav': nav_stack.append(line_num)
            if tag == '<header': header_stack.append(line_num)
            if tag == '<>': frag_stack.append(line_num)
            
        for tag in closes:
            if tag == '</div':
                if div_stack: div_stack.pop()
                else: print(f"Extra </div> at line {line_num}")
            if tag == '</nav':
                if nav_stack: nav_stack.pop()
                else: print(f"Extra </nav> at line {line_num}")
            if tag == '</header':
                if header_stack: header_stack.pop()
                else: print(f"Extra </header> at line {line_num}")
            if tag == '</>':
                if frag_stack: frag_stack.pop()
                else: print(f"Extra </> at line {line_num}")

    print(f"\nResults for {file_path}:")
    print(f"Unclosed <div>: {div_stack}")
    print(f"Unclosed <nav>: {nav_stack}")
    print(f"Unclosed <header>: {header_stack}")
    print(f"Unclosed <>: {frag_stack}")

check_jsx_balance(r'd:\AutofinderWebsite\AutofinderWebsite\src\Pages\include\Header.jsx')
