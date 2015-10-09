# Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
# This software is licensed under a MIT style license


# Have this script stop on any error
set -e

# Run the example
echo "Running examples at http://127.0.0.1:8000 ..."
python -m http.server 8000
