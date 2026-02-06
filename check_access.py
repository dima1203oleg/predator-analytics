import os


file_path = "March_2024_Registry.xlsx"

print(f"Checking access to {file_path}...")
try:
    if os.path.exists(file_path):
        print("File exists.")
        try:
            with open(file_path, "rb") as f:
                # Read first 10 bytes to verify read access
                header = f.read(10)
                print(f"Successfully read header: {header}")
        except PermissionError:
            print("Permission denied when reading.")
        except Exception as e:
            print(f"Error reading: {e}")
    else:
        print("File does NOT exist in current directory.")
        # List dir to be sure
        print("Directory contents:")
        print(os.listdir("."))
except Exception as e:
    print(f"General Error: {e}")
