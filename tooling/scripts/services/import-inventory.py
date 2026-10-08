"""Refresh offline official inventories. Development only; never runs in the app.
Run from repository root: python3 tooling/scripts/services/import-inventory.py
Review source coverage and generated diffs before committing.
"""
import json,pathlib,re,html,urllib.parse,urllib.request,hashlib,datetime,tempfile
root=pathlib.Path(tempfile.mkdtemp(prefix='planner-inventory-'))
urls={'aws-tree':'https://api.github.com/repos/boto/botocore/git/trees/develop?recursive=1','azure':'https://azure.microsoft.com/en-us/products','gcp':'https://cloud.google.com/products','oracle':'https://raw.githubusercontent.com/oracle/oci-python-sdk/master/src/oci/__init__.py','ibm-html':'https://cloud.ibm.com/catalog'}
for key,url in urls.items():
 root.joinpath(key).write_bytes(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Cloud-Architecture-Planner inventory importer'}),timeout=90).read())
from html.parser import HTMLParser
class Links(HTMLParser):
 def __init__(self):super().__init__();self.href=None;self.text='';self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.href=dict(attrs).get('href');self.text=''
 def handle_data(self,data):
  if self.href:self.text+=data
 def handle_endtag(self,tag):
  if tag=='a' and self.href:self.links.append((self.href,' '.join(self.text.split())));self.href=None
parser=Links();parser.feed(root.joinpath('azure').read_text());root.joinpath('azure-links.json').write_text(json.dumps(parser.links))
entries=[];sources=[]
def add(p,n,u,key=None):
 n=html.unescape(n).strip(); n=re.sub(r'\\u([0-9a-fA-F]{4})',lambda m:chr(int(m[1],16)),n)
 if not n:return
 key=key or urllib.parse.urlparse(u).path.strip('/').replace('/','-')
 key=re.sub('[^a-z0-9-]+','-',key.lower()).strip('-')
 if not any(e['provider']==p and e['id']=='catalog-'+key for e in entries):entries.append(dict(provider=p,id='catalog-'+key,name=n,url=u))
def source(p,u,scope):sources.append(dict(provider=p,url=u,retrieved=datetime.date.today().isoformat(),scope=scope))
x=json.loads((root/'aws-tree').read_text());assert not x['truncated']
for key in sorted({i['path'].split('/')[2] for i in x['tree'] if re.match(r'botocore/data/[^/]+/[^/]+/service-2.json$',i['path'])}):add('aws',key,'https://docs.aws.amazon.com/cli/latest/reference/'+key+'/',key)
source('aws','https://github.com/boto/botocore/tree/develop/botocore/data','All service API namespaces in the fetched official SDK tree; API namespaces are not a one-to-one commercial product list. Marketing-only products may be absent.')
for u,n in json.loads((root/'azure-links.json').read_text()):
 path=urllib.parse.urlparse(u).path
 if '/products/' in path and '/category/' not in path and n and not n.startswith(('View all','Explore','Learn more','See all')):add('azure',n,u,path.split('/products/')[1].strip('/'))
source('azure','https://azure.microsoft.com/en-us/products','Product links published in the official directory, including product families and subproducts; excludes category and navigation links.')
s=html.unescape((root/'gcp').read_text())
for n,u in re.findall(r'\[\["([^"<>]+)","(https://(?:cloud.google.com|firebase.google.com|looker.com|about.appsheet.com)/[^"<>]+)"',s):add('gcp',n,u)
source('gcp','https://cloud.google.com/products','Directory records embedded in the official page, including product families, solutions and developer products; entries are not all independently deployable services.')
s=(root/'oracle').read_text();m=list(re.finditer(r'from \. import ([^\n]+)',s))[-1]
for key in m[1].split(', '):add('oracle',key.replace('_',' ').title(),'https://docs.oracle.com/en-us/iaas/tools/python/latest/api/'+key+'.html',key)
source('oracle','https://github.com/oracle/oci-python-sdk/blob/master/src/oci/__init__.py','All imported OCI SDK service namespaces, including control/data plane APIs; not a one-to-one commercial product list.')
s=(root/'ibm-html').read_text(); marker='window.__PRELOADED_STATE__ = '; state=json.JSONDecoder().raw_decode(s[s.index(marker)+len(marker):])[0]
def walk(x):
 if isinstance(x,dict):
  if (x.get('kind')=='service' or x.get('kind')=='iaas' and x.get('type') in ('iaas','service')) and x.get('tag')=='ibm_created':add('ibm',x['name'],urllib.parse.urljoin('https://cloud.ibm.com',x['catalogUrl']),x.get('originalName',x['id']))
  for v in x.values():walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
 elif isinstance(x,str) and x.startswith(('{','[')):
  try:walk(json.loads(x))
  except ValueError:pass
walk(state)
source('ibm','https://cloud.ibm.com/catalog','All IBM-created service and infrastructure tiles in the fetched public catalog state. Excludes third-party marketplace entries, deployable architectures, and private or account-specific offerings.')
for source_entry in sources:
 key={'aws':'aws-tree','azure':'azure','gcp':'gcp','oracle':'oracle','ibm':'ibm-html'}[source_entry['provider']]
 source_entry['rawSha256']=hashlib.sha256(root.joinpath(key).read_bytes()).hexdigest()
entries.sort(key=lambda e:(e['provider'],e['name'].lower()))
assert all(sum(e['provider']==p for e in entries)>50 for p in ('aws','azure','gcp','oracle','ibm')), 'Incomplete extraction; keep the previous snapshot'
pathlib.Path('data/services/inventory.json').write_text(json.dumps(dict(sources=sources,services=entries),indent=2)+'\n')
from collections import Counter
print(Counter(e['provider'] for e in entries))
