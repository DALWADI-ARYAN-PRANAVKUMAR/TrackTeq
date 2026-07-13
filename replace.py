import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'Track-Teq' in content or 'TRACK-TEQ' in content or 'transitops' in content:
            # We don't want to replace in DB or node_modules or venv
            if 'transitops-token' not in content and 'transitops-v3' not in content:
                pass # let's just replace all occurrences of Track-Teq and TRACK-TEQ
                
            new_content = content.replace('Track-Teq', 'Track-Teq').replace('TRACK-TEQ', 'TRACK-TEQ')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"Updated {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if 'venv' in dirs:
        dirs.remove('venv')
    if '.git' in dirs:
        dirs.remove('.git')
        
    for file in files:
        if file.endswith(('.tsx', '.ts', '.py', '.md', '.html')):
            replace_in_file(os.path.join(root, file))

print("Replacement complete.")
