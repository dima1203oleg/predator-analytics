from __future__ import annotations

import csv
import sys

import openpyxl


def convert_xlsx_to_csv(input_path, output_path):
    print(f"Converting {input_path} to {output_path}...")
    wb = openpyxl.load_workbook(input_path, read_only=True, data_only=True)
    sheet = wb.active
    if sheet is None:
        print("Error: Could not find active sheet.")
        return

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for row in sheet.iter_rows(values_only=True):
            writer.writerow(row)
    print("Conversion complete.")

if __name__ == "__main__":
    convert_xlsx_to_csv(sys.argv[1], sys.argv[2])
