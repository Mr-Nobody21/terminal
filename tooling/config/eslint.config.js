import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
export default ts.config({ignores:['packages/desktop/target/**','packages/desktop/gen/**','**/dist/**','desktop-dist/**','release/**','.runtime/**','node_modules/**','test-results/**','playwright-report/**']},js.configs.recommended,...ts.configs.recommended,{languageOptions:{globals:{...globals.browser,...globals.node}}});
