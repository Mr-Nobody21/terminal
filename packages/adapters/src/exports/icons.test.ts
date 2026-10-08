import { it,expect } from 'vitest';
import { services } from '@planner/domain/providers';
import {iconData,iconSvg} from './icons';
it('bundles core vendor icons and explicitly falls back for catalog-only services',()=>{for(const s of services){expect(iconSvg(s.provider,s.id)).toContain('<svg');expect(iconData(s.provider,s.id)).toContain('data:image/svg+xml,');if(s.category!=='unsupported')expect(iconSvg(s.provider,s.id)).not.toBe(iconSvg('aws','unknown'));else expect(iconSvg(s.provider,s.id)).toBe(iconSvg('aws','unknown'));}expect(iconSvg('aws','unknown')).toContain('<svg');});
