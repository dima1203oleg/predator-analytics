import os

def main():
    old_file = "/Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/BootSequenceWRAITH.tsx"
    new_file = "/Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/BootSequenceELITE.tsx"
    
    if os.path.exists(old_file):
        os.rename(old_file, new_file)
        print(f"Renamed: {old_file} to {new_file}")
    else:
        print(f"File not found: {old_file}")

if __name__ == "__main__":
    main()
