import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {sampleProject} from '@planner/domain/examples';
import {readdirSync,readFileSync} from 'node:fs';
function files(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(dir+'/'+entry.name):entry.name.endsWith('.svg')?[dir+'/'+entry.name]:[]);}
const assets=files('backend/assets').map(path=>({key:path.slice('backend/assets'.length),mime:'image/svg+xml',content:readFileSync(path,'utf8')}));
const saved=sampleProject();saved.id='13131313-1313-4313-8313-131313131313';saved.name='Saved account example';
const user={id:'12121212-1212-4212-8212-121212121212',email:'review@example.com',displayName:'UI review'};
async function panel(page:Page,name:string){const button=page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true});if(await button.getAttribute('aria-expanded')!=='true')await button.click();}
const modes=[{name:'desktop',width:1440,height:1000,dark:false},{name:'mobile',width:390,height:844,dark:false},{name:'dark',width:1280,height:900,dark:true}];
for(const mode of modes)test(`DevTools popup and menu review: ${mode.name}`,async({page},info:TestInfo)=>{
 test.setTimeout(45000);
 await page.setViewportSize(mode);await page.emulateMedia({colorScheme:mode.dark?'dark':'light'});
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/api/auth/me'?{user}:path==='/api/assets/catalog'?{assets}:path==='/api/projects'?{projects:[{id:saved.id,name:saved.name,revision:1}]}:path===`/api/projects/${saved.id}`?{document:saved,drawings:[],revision:1}:{ok:true}});});
 const cdp=await page.context().newCDPSession(page);
 const reports:unknown[]=[];
 const capture=async(name:string)=>{
  const metrics=await cdp.send('Page.getLayoutMetrics');
  const surfaces=await page.locator('dialog,.zen-drawer,.service-palette,.properties-panel,.more-tools-content,.connections,.settings-panel').evaluateAll(elements=>elements.filter(element=>element.checkVisibility()).map(element=>{const rect=element.getBoundingClientRect(),style=getComputedStyle(element);return {className:element.className,x:rect.x,y:rect.y,width:rect.width,height:rect.height,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,padding:style.padding,gap:style.gap};}));
  reports.push({name,metrics,surfaces});
  expect(surfaces.filter(surface=>surface.scrollWidth>surface.clientWidth+1),name+' overflowing surfaces').toEqual([]);
  expect(surfaces.filter(surface=>surface.x<0||surface.x+surface.width>mode.width+1),name+' clipped surfaces').toEqual([]);
  await page.screenshot({path:`test-results/ui-${mode.name}-${name}.png`,animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name).toBe(true);
  const clipped=await page.locator('.header-actions button,.header-actions select').evaluateAll(elements=>elements.filter(element=>element.checkVisibility()).filter(element=>{const rect=element.getBoundingClientRect();return rect.left<0||rect.right>innerWidth+1;}).map(element=>element.textContent));
  expect(clipped,name+' header controls').toEqual([]);
 };
 await page.goto('/');await capture('onboarding');await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('link',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:'New project',exact:true}).click();await capture('dashboard-create');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('link',{name:'Workspace',exact:true}).click();
 await panel(page,'Projects');await capture('projects');
 await page.getByRole('button',{name:'List account projects'}).click();await expect(page.getByRole('button',{name:'Delete account project'})).toBeVisible();await capture('account-projects');
 await page.getByRole('button',{name:'Open account project',exact:true}).click();await expect(page.getByRole('dialog',{name:'Open account snapshot?'})).toBeVisible();await capture('restore-confirm');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.evaluate(project=>new Promise<void>((resolve,reject)=>{const request=indexedDB.open('cloud-planner-v1',10);request.onupgradeneeded=()=>{const store=request.result.createObjectStore('projects',{keyPath:'id'});store.createIndex('updatedAt','updatedAt');store.createIndex('name','name');};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const database=request.result,transaction=database.transaction('projects','readwrite');transaction.objectStore('projects').put(project);transaction.oncomplete=()=>{database.close();resolve();};transaction.onerror=()=>reject(transaction.error);};}),saved);
 await page.getByRole('button',{name:'Import previous device projects'}).click();await expect(page.getByRole('dialog',{name:'Import device projects?'})).toBeVisible();await capture('legacy-import-confirm');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 const confirmations:string[]=[];
 await page.getByRole('button',{name:'Delete account project'}).click();await expect(page.getByRole('dialog')).toContainText('Delete account project?');await capture('delete-account-confirm');confirmations.push('delete account');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Delete project',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Delete device project?');await capture('delete-device-confirm');confirmations.push('delete device');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'New project',exact:true}).click();await capture('project-create');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'New example',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'New example',exact:true}).click();await capture('example-create');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await panel(page,'Requirements');await capture('requirements');await panel(page,'Costs');
 for(const summary of await page.locator('.cost-panel summary').all())await summary.click();await capture('cost-details');
 await page.getByRole('button',{name:'Export',exact:true}).click();await capture('architecture-export');
 const chooser=page.waitForEvent('filechooser');await page.getByLabel('Import Mermaid, XML, Excel or image').click();await chooser;
 await page.getByRole('button',{name:'Close panel',exact:true}).click();await panel(page,'Shapes');await page.getByLabel('Search services').fill('server');await capture('service-search');
 await page.getByRole('button',{name:'Close shapes',exact:true}).click();
 await page.getByLabel('More diagram tools').click();await capture('more-tools');await page.getByRole('button',{name:'Add boundary',exact:true}).click();await page.getByLabel('More diagram tools').click();await capture('boundary-properties');await page.getByRole('button',{name:'Close properties'}).click();
 await page.getByText('Resources & connections',{exact:false}).click();await capture('architecture-connections');await page.getByRole('button',{name:'ECS / Fargate',exact:true}).click();await page.getByText('More settings',{exact:true}).click();await page.getByText('Monthly workload inputs',{exact:true}).click();await capture('resource-properties');await page.getByRole('button',{name:'Close properties'}).click();
 await page.getByText('Resources & connections',{exact:false}).click();await page.locator('.architecture-surface .connections > button').first().click();await capture('architecture-connector-properties');await page.getByRole('button',{name:'Close properties'}).click();
 await page.getByRole('link',{name:'AI settings',exact:true}).click();await capture('ai-settings');
 for(const provider of await page.getByLabel('AI provider',{exact:true}).locator('option').evaluateAll(options=>options.map(option=>(option as HTMLOptionElement).value))){await page.getByLabel('AI provider', {exact:true}).selectOption(provider);await capture('ai-'+provider);}
 await page.getByRole('link',{name:'Return to workspace'}).click();
 for(const kind of ['flowchart','sequence','er','infrastructure']){
  await page.getByLabel('Diagram type').selectOption(kind);await panel(page,'Shapes');
  if(kind==='infrastructure'){await page.getByLabel('Search assets').fill('MongoDB');await page.getByRole('button',{name:'Add MongoDB',exact:true}).click();}
  else await page.getByRole('button',{name:kind==='sequence'?'Add participant':kind==='er'?'Add entity':'Add process',exact:true}).click();
  await capture(kind+'-palette');
  await page.getByRole('button',{name:kind==='infrastructure'?'Add MongoDB':kind==='sequence'?'Add participant':kind==='er'?'Add entity':'Add process',exact:true}).click();
  await page.getByRole('button',{name:'Close shapes',exact:true}).click();
  await page.getByText(kind==='sequence'?'Participants & messages':'Shapes & connections',{exact:true}).click();await capture(kind+'-connections');
  await page.locator('.drawing-editor .resource-list button').first().click();await capture(kind+'-properties');await page.getByRole('button',{name:'Close properties'}).click();
  await page.getByText(kind==='sequence'?'Participants & messages':'Shapes & connections',{exact:true}).click();
  await page.getByLabel('Drawing connection source').selectOption({index:1});await page.getByLabel('Drawing connection target').selectOption({index:2});await page.getByLabel('Drawing connection label').fill('Audit connector');
  await page.getByRole('button',{name:kind==='sequence'?'Add message':'Connect shapes',exact:true}).click();await page.locator('.drawing-connection-row button').first().click();await capture(kind+'-connector-properties');
  if(kind==='er')await page.getByLabel('Relationship cardinality').selectOption('N:M');
  await page.getByRole('button',{name:'Close properties'}).click();
  await page.getByRole('button',{name:'Export',exact:true}).click();await capture(kind+'-export');await page.getByRole('button',{name:'Close panel',exact:true}).click();
 }
 await page.getByRole('button',{name:'Export',exact:true}).click();
 await page.getByLabel('Import Mermaid, XML, Excel or image').setInputFiles({name:'audit-reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1sAAAAASUVORK5CYII=','base64')});
 await expect(page.locator('.reference-image')).toHaveCount(1);await capture('import-notification');
 const banner=await page.getByRole('alert').boundingBox(),close=await page.getByRole('button',{name:'Close panel',exact:true}).boundingBox();expect(close!.y).toBeGreaterThanOrEqual(banner!.y+banner!.height);
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByText('Shapes & connections',{exact:true}).click();await page.getByRole('button',{name:'audit-reference.png',exact:true}).click();await capture('image-properties');await page.getByRole('button',{name:'Close properties'}).click();
 for(const select of await page.getByRole('combobox').all()){await select.focus();await page.keyboard.press('Space');await page.keyboard.press('Escape');}
 const selects=await page.locator('select').evaluateAll(elements=>elements.filter(element=>element.checkVisibility()).map(element=>({name:element.getAttribute('aria-label'),height:element.getBoundingClientRect().height,paddingRight:getComputedStyle(element).paddingRight,backgroundImage:getComputedStyle(element).backgroundImage})));
 expect(await page.locator('.zen-drawer').evaluate(element=>getComputedStyle(element).paddingLeft)).toBe(mode.name==='mobile'?'20px':'24px');
 const snapshot=await cdp.send('DOMSnapshot.captureSnapshot',{computedStyles:['padding-top','padding-right','padding-bottom','padding-left','gap','line-height'],includeDOMRects:true});
 await info.attach('DevTools popup audit',{body:JSON.stringify({reports,selects,confirmations,snapshot}),contentType:'application/json'});
});

for(const mode of modes)test(`DevTools authentication forms and validation spacing: ${mode.name}`,async({page},info)=>{
 await page.setViewportSize(mode);await page.emulateMedia({colorScheme:mode.dark?'dark':'light'});
 await page.route('**/api/auth/me',route=>route.fulfill({status:401,json:{error:'Sign in required'}}));
 await page.route('**/api/auth/login',route=>route.fulfill({json:{otpRequired:true,expiresIn:300,method:'development-fixed'}}));
 await page.goto('/');await page.screenshot({path:`test-results/ui-${mode.name}-auth-login.png`});
 await page.getByRole('button',{name:'Create an account',exact:true}).click();await page.getByRole('button',{name:'Create account',exact:true}).click();await page.screenshot({path:`test-results/ui-${mode.name}-auth-validation.png`});
 await page.getByRole('button',{name:'Already have an account? Sign in'}).click();await page.getByLabel('Email',{exact:true}).fill('review@example.com');await page.getByLabel('Password',{exact:true}).fill('a secure password phrase');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Verify your sign-in'})).toBeVisible();await page.screenshot({path:`test-results/ui-${mode.name}-auth-otp.png`});
 const cdp=await page.context().newCDPSession(page);await info.attach('Auth DevTools layout',{body:JSON.stringify(await cdp.send('Page.getLayoutMetrics')),contentType:'application/json'});
});

test('styled confirmation protects deletion until explicitly accepted',async({page})=>{
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/api/auth/me'?{user}:path==='/api/assets/catalog'?{assets}:path==='/api/projects'?{projects:[]}:{ok:true}});});
 await page.goto('/');await page.getByRole('button',{name:'Plan with costs',exact:true}).click();await panel(page,'Projects');
 await page.getByLabel('Project name',{exact:true}).fill('Keep until confirmed');
 await page.getByRole('button',{name:'Delete project',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Delete device project?'});await expect(dialog.getByRole('button',{name:'Cancel'})).toBeFocused();await dialog.getByRole('button',{name:'Cancel'}).click();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Keep until confirmed');
 await page.getByRole('button',{name:'Delete project',exact:true}).click();await dialog.getByRole('button',{name:'Delete project',exact:true}).click();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Web application architecture');
 await page.getByRole('link',{name:'Dashboard',exact:true}).click();await expect(page.getByRole('button',{name:'Open Keep until confirmed',exact:true})).toHaveCount(0);
});
