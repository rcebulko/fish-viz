# Reef Census Data Visualization

The flag `--log-sql` may be added to the invocation of any file to enabled logging of SQL statements

## schema.js
`> node schema [--species] [--samples]`
    - `--species`: creates/re-creates the `species` table
    - `--samples`: creates/re-creates the `samples` table

## import_data.js
`> node import_data [--species] [--samples] [--port <port>]`
    - `--species`: imports species data
    - `--sample`: imports sample data
    - `--port`: if provided, starts the server in the background on the given port

## server.js
`> node server [--port <port>]`
    - `--port`: starts the server on the given port (default 90)
