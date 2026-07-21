import os

base_dir = '/Users/dima1203/.gemini/antigravity-ide/brain/0c22b174-45b7-427b-8845-466dfd5394ad'
files = [
    'PREDATOR_vNext_Master_Blueprint.md',
    'PREDATOR_vNext_Phase1_Architecture.md',
    'PREDATOR_vNext_Phase2_MultiAgent.md',
    'PREDATOR_vNext_Phase3_Cognitive.md',
    'PREDATOR_vNext_Phase4_Connector.md',
    'PREDATOR_vNext_Phase5_Roadmap.md'
]

output_file = '/Users/Shared/Predator_60/docs/PREDATOR_vNext_Final_Documentation.md'

with open(output_file, 'w', encoding='utf-8') as outfile:
    outfile.write("# PREDATOR Analytics vNext - Final Documentation\n\n")
    for filename in files:
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
                outfile.write("\n\n---\n\n")
            print(f"Added {filename}")
        else:
            print(f"Warning: {filename} not found.")

print("Docs compiled successfully to", output_file)
