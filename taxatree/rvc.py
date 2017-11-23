import urllib.parse
import urllib.request

import pandas


regions = (
    'DRY TORT',
    'FLA KEYS',
    'SEFCRI',
)

years = {
    'DRY TORT': (1999, 2000, 2004, 2006, 2008, 2010, 2012, 2014, 2016),
    'FLA KEYS': (1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2016),
    'SEFCRI': (2013, 2014, 2015, 2016),
}


def get_data(url):
    print('Requesting:', url)
    with urllib.request.urlopen(url) as response:
        return pandas.read_csv(response)

def get_(dtype, region=None, year=None):
    if region is not None and year is not None and year in years[region]:
        dtype = urllib.parse.quote(f'{dtype}')
        region = urllib.parse.quote(f'{region}')
        year = urllib.parse.quote(f'{year}')
        url = f'https://grunt.sefsc.noaa.gov/rvc_analysis20/{dtype}/index.csv?region={region}&year={year}'
        return get_data(url)

    if region is None:
        data = [get_(dtype, region=region, year=year) for region in regions]
        return pandas.DataFrame().append(data, ignore_index=True)

    if year is None:
        data = [get_(dtype, region=region, year=year) for year in years[region]]
        return pandas.DataFrame().append(data, ignore_index=True)


def get_samples(region=None, year=None):
    return get_('samples', region=region, year=year)

def get_strata(region=None, year=None):
    return get_('strata', region=region, year=year)

def get_taxa():
    url = 'https://grunt.sefsc.noaa.gov/rvc_analysis20/taxa/index.csv'
    return get_data(url)


if __name__ == '__main__':

    print('Getting Samples')
    data = get_samples()
    with open('samples.csv', 'w') as f:
        print(data.to_csv(), file=f)

    print('Getting Strata')
    data = get_strata()
    with open('strata.csv', 'w') as f:
        print(data.to_csv(), file=f)

    print('Getting Taxa')
    data = get_taxa()
    with open('taxa.csv', 'w') as f:
        print(data.to_csv(), file=f)

