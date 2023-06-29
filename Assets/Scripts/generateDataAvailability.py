import os
import json

def count_files(folder_path):
    file_count = 0
    for _, _, files in os.walk(folder_path):
        file_count += len(files)
    return file_count

def generate_json(folders, output_path):
    data = {}

    for folder in folders:

      folder_path = os.path.join(script_directory, "../../../HFRadarData/" + folder)
      for _, _, files in os.walk(folder_path):
          for file_name in files:
                # Check minimum size
                file_path = os.path.join(folder_path, file_name)
                if os.path.getsize(file_path) >= min_file_size:
                    timestamp = extract_timestamp(file_name)
                    if timestamp:
                        timestamp_formatted = format_timestamp(timestamp)  # Format the timestamp
                        if timestamp_formatted not in data:
                            data[timestamp_formatted] = {}
                        # TODO: read some information about quality flags / number of points and write it to the radar
                        data[timestamp_formatted][folder] = True


    #print(data)
    with open(output_path, "w") as json_file:
        jsonData = json.dumps(data)
        # Prepend export default text
        jsonData = 'let hfRadarDataAvailability;\nexport default hfRadarDataAvailability = ' + jsonData
        # Write to file
        json_file.write(jsonData)


def extract_timestamp(file_name):
    if file_name.startswith("RDLm_BEGU_") and file_name.endswith(".ruv"):
        return file_name[10:-4]
    elif file_name.startswith("RDLm_CREU_") and file_name.endswith(".ruv"):
        return file_name[10:-4]
    elif file_name.startswith("TOTL_ROSE_") and file_name.endswith(".tuv"):
        return file_name[10:-4]
    return None


def format_timestamp(timestamp):
    year = timestamp[:4]
    month = timestamp[5:7]
    day = timestamp[8:10]
    hour = timestamp[11:13]
    minute = timestamp[13:]
    formatted_timestamp = f"{year}-{month}-{day}T{hour}Z"
    return formatted_timestamp


# Get the absolute path of the script's directory
script_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the folders to search for files
folders = ["BEGU", "CREU", "ROSE"]

# Specify the minimum file size in bytes
min_file_size = 15240  # 10KB


output_path = "../../data/hfRadarDataAvailability.js"

# Convert the paths to the correct format for Windows if necessary
output_path = os.path.normpath(output_path)


generate_json(folders, output_path) 