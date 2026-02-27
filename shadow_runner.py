
"""
Module: shadow_runner
Component: SHADOW OPERATOR EXECUTOR
Predator Analytics v45.1 - Autonomous Logic
"""
import subprocess
import sys
import json
import os
import argparse

def execute_command(command: str):
    print(f"💀 EXECUTING: {command}")
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            executable='/bin/bash'
        )
        
        # Stream output in real-time
        for line in process.stdout:
            print(line, end="")
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"❌ FAILED (Exit {process.returncode})")
            print(f"ERROR: {stderr}")
            return False
        
        print("✅ SUCCESS")
        return True
    except Exception as e:
        print(f"‼️ CRITICAL ERROR: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Shadow Operator Executor")
    parser.add_argument("--execute", type=str, help="Direct bash command to execute")
    parser.add_argument("--task-file", type=str, default="tasks.json", help="Path to JSON task list")
    args = parser.parse_args()

    if args.execute:
        execute_command(args.execute)
    elif os.path.exists(args.task_file):
        try:
            with open(args.task_file, 'r') as f:
                tasks = json.load(f)
            for task in tasks:
                if not execute_command(task.get("cmd")):
                    if not task.get("continue_on_error", False):
                        sys.exit(1)
        except Exception as e:
            print(f"Failed to read tasks: {e}")
            sys.exit(1)
    else:
        print("💀 SHADOW RUNNER: No tasks provided.")

if __name__ == "__main__":
    main()
