#!/bin/bash

# Navigate to the HFRadarData folder
cd ../../../HFRadarData

# Perform git pull to update the repository
git pull

# Move back to the original directory
cd ..
cd HFRadar/Assets/Scripts

# Make sure you are on the last version of the web app
git pull

# Call the generateDataAvailability.py script
python generateDataAvailability.py

# Perform git operations to add, commit, and push the changes
git add ../../data/hfRadarDataAvailability.json
git commit -m "automatically updated data availability"
git push