#import pandas as pd
import csv

rfilename = "data.tsv"

#def unicode_csv_reader(utf8_data, dialect=csv.excel, **kwargs):
#    csv_reader = csv.reader(utf8_data, dialect=dialect,delimiter='\t')
#    for row in csv_reader:
#        yield [unicode(cell, 'utf-8') for cell in row]

file = open(rfilename,'r',encoding='UTF-8')
content = file.read()

print(content)


"""tsvfile = open(rfilename)
#read_tsv = csv.reader(tsvfile,delimiter="\t")
reader = unicode_csv_reader(tsvfile)
for row in reader:
    print(row)

tsvfile.close()

#with open(rfilename,'r') as csv_in:
"""