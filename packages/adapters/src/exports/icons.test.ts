import { it,expect } from 'vitest';
import { services } from '@planner/domain/providers';
import {iconData,iconSvg} from './icons';
it('bundles a vendor SVG for every service and a generic fallback',()=>{for(const s of services){expect(iconSvg(s.provider,s.id)).toContain('<svg');expect(iconData(s.provider,s.id)).toContain('data:image/svg+xml,');expect(iconSvg(s.provider,s.id)).not.toBe(iconSvg('aws','unknown'));}expect(iconSvg('aws','unknown')).toContain('<svg');});
