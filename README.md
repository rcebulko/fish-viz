# Reef Census Data Visualization

The flag `--log-sql` may be added to the invocation of any file to enabled logging of SQL statements

## schema.js
`> node schema [--species] [--samples]`
    -   `--species` creates/re-creates the `species` table
    -   `--samples` creates/re-creates the `samples` table

To initialize database, run 'node schema [--species] [--sample]'
To import data into empty tables, run 'node import_data [--species] [--sample]'
Add the flag `--log-sql` to print SQL statements to stdout
