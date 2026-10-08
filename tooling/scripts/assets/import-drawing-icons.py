"""Import selected official icons. Development-only network access; no runtime downloads."""
import base64,hashlib,json,urllib.request,urllib.parse,zlib,xml.etree.ElementTree as ET,zipfile,io
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'backend/assets/drawing-assets'
manifest=[]
def save(library,key,data,source,upstream):
    ET.fromstring(data)
    target=OUT/library/(key+'.svg');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    manifest.append(dict(id=f'{library}/{key}',source=source,upstream=upstream,retrieved='2026-10-08',sha256=hashlib.sha256(data).hexdigest()))
for library,repo,selected in [
 ('ibm','IBM-Cloud/architecture-icons',{'virtual-server':'svg/Compute/Virtual Server.svg','kubernetes':'svg/Compute/Kubernetes.svg','database':'svg/Data & Storage/Database.svg','object-storage':'svg/Data & Storage/Object Bucket.svg','load-balancer':'svg/Networking/load-balancer--application.svg','vpc':'svg/Networking/ibm-cloud--vpc.svg'}),
 ('kubernetes','kubernetes/community',{'pod':'icons/svg/resources/unlabeled/pod.svg','deployment':'icons/svg/resources/unlabeled/deploy.svg','service':'icons/svg/resources/unlabeled/svc.svg','ingress':'icons/svg/resources/unlabeled/ing.svg','secret':'icons/svg/resources/unlabeled/secret.svg','node':'icons/svg/infrastructure_components/unlabeled/node.svg'})]:
    metadata=json.load(urllib.request.urlopen(f'https://api.github.com/repos/{repo}/commits/main'));sha=metadata['sha']
    for key,path in selected.items():
        url=f'https://raw.githubusercontent.com/{repo}/{sha}/'+urllib.parse.quote(path)
        save(library,key,urllib.request.urlopen(url).read(),url,path)
    if library == 'kubernetes':
        (OUT/'KUBERNETES-LICENSE.txt').write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/{repo}/{sha}/LICENSE').read())
# Convert Oracle's selected original draw.io vector stencils into equivalent SVG paths.
# No vendor artwork is redrawn. Labels are supplied by the editor beside the icon.
source='https://docs.oracle.com/iaas/Content/Resources/Assets/OCI-Style-Guide-for-Drawio.zip'
archive=zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(source).read()))
items=json.loads(ET.fromstring(archive.read('OCI Style Guide for Drawio/OCI Library.xml')).text)
selected={'compute':'Compute - Virtual Machine VM','functions':'Compute - Functions','object-storage':'Storage - Object Storage','vcn':'Networking - Virtual Cloud Network VCN','load-balancer':'Networking - Load Balancer','autonomous-db':'Database - Autonomous DB'}
def decode(value):return urllib.parse.unquote(zlib.decompress(base64.b64decode(value),-15).decode())
for key,title in selected.items():
    item=next(x for x in items if x.get('title')==title);root=ET.fromstring(decode(item['xml']));cells={c.get('id'):c for c in root.findall('.//mxCell')};groups=[]
    def offset(cell):
        geo=cell.find('mxGeometry');x=float(geo.get('x',0)) if geo is not None else 0;y=float(geo.get('y',0)) if geo is not None else 0
        parent=cells.get(cell.get('parent'))
        if parent is not None:
            px,py=offset(parent);x+=px;y+=py
        return x,y
    for cell in cells.values():
        style=dict(p.split('=',1) for p in cell.get('style','').split(';') if '=' in p);shape=style.get('shape','')
        if not shape.startswith('stencil('):continue
        stencil=ET.fromstring(decode(shape[8:-1]));geo=cell.find('mxGeometry');x,y=offset(cell);w=float(geo.get('width',100));h=float(geo.get('height',100))
        paths=[]
        for path in stencil.findall('.//path'):
            parts=[]
            for command in path:
                a=command.attrib
                if command.tag=='move':parts.append(f"M{a['x']} {a['y']}")
                elif command.tag=='line':parts.append(f"L{a['x']} {a['y']}")
                elif command.tag=='curve':parts.append(f"C{a['x1']} {a['y1']} {a['x2']} {a['y2']} {a['x3']} {a['y3']}")
                elif command.tag=='close':parts.append('Z')
                else:raise ValueError('Unsupported Oracle stencil operation: '+command.tag)
            fill=style.get('fillColor','#312D2A');stroke=style.get('strokeColor','none')
            paths.append(f'<path d="{" ".join(parts)}" fill="{fill}" stroke="{stroke}"/>')
        groups.append(f'<g transform="translate({x} {y}) scale({w/100} {h/100})">{"".join(paths)}</g>')
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {item["w"]} {item["h"]}">{"".join(groups)}</svg>'
    save('oracle',key,svg.encode(),source,title)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Imported {len(manifest)} attributed official assets.')
