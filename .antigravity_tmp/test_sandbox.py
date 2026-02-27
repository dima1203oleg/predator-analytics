import os

def test_sandbox():
    try:
        # Define the test file path
        test_file_path = os.path.join(os.path.dirname(__file__), 'sandbox_test_file.txt')
        
        # Write to the file
        with open(test_file_path, 'w') as f:
            f.write("Sandbox test successful!")
        print(f"✅ Successfully wrote to {test_file_path}")
        
        # Read from the file
        with open(test_file_path, 'r') as f:
            content = f.read()
        print(f"✅ Successfully read from {test_file_path}: {content}")
        
        # Clean up
        os.remove(test_file_path)
        print(f"✅ Successfully cleaned up {test_file_path}")
        
        print("🎉 Sandbox test passed! No permission issues.")
    except Exception as e:
        print(f"❌ Sandbox test failed: {e}")

if __name__ == "__main__":
    test_sandbox()
