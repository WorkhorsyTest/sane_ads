# Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
# This software is licensed under a MIT style license


# Have this script stop on any error
set -e

# If there are no arguments, print the correct usage and exit
if [ "$#" -ne 1 ]; then
	echo "Run the python HTTP server in this directory" >&2
	echo "Usage: ./make.sh port" >&2
	echo "Example: ./make.sh 9000" >&2
	exit 1
fi

# Run the example
echo "Running examples at http://127.0.0.1:8000 ..."
python -m http.server 8000
