import {defineConfig} from '@playwright/test';
const preview=process.env.MOTIONGARDEN_TEST_PREVIEW==='1';
const url=`http://127.0.0.1:${preview?4173:5173}`;
export default defineConfig({testDir:'tests',workers:2,use:{baseURL:url},webServer:{command:preview?'npx vite preview --host 127.0.0.1 --port 4173 --strictPort':'npm run dev -- --port 5173 --strictPort',url,reuseExistingServer:!process.env.CI&&!preview}});

