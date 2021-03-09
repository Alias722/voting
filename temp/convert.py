import csv

# read tab-delimited file
with open('data.tsv','rb') as fin:
    cr = csv.reader(fin, delimiter='\t')
    filecontents = [line for line in cr]
for e in filecontents:
    print(e)
# write comma-delimited file (comma is the default delimiter)
#with open('data.csv','wb') as fou:
#    cw = csv.writer(fou, quotechar='', quoting=csv.QUOTE_NONE)
#    cw.writerows(filecontents)

#with open('interactome.csv','wb') as fou:
#        cw = csv.writer(fou, quotechar='', quoting=csv.QUOTE_NONE, escapechar='\\')
#            cw.writerows(filecontents)
