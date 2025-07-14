import { createCommand } from '@commander-js/extra-typings';
import * as fs from 'fs';
import * as path from 'path';

// 조건 평가를 위한 환경 변수
const CONDITIONS = {
    'ext_abp': false,
    'ext_ublock': true,
    'env_firefox': false,
    'cap_html_filtering': false,
    'cap_user_stylesheet': true
};

// 조건을 평가하는 함수
function evaluateCondition(condition: string): boolean {
    const trimmedCondition = condition.trim();
    
    // 단순한 변수 체크
    if (trimmedCondition in CONDITIONS) {
        return CONDITIONS[trimmedCondition as keyof typeof CONDITIONS];
    }
    
    // 논리 연산자 처리
    if (trimmedCondition.includes('&&')) {
        return trimmedCondition.split('&&').every(part => evaluateCondition(part.trim()));
    }
    
    if (trimmedCondition.includes('||')) {
        return trimmedCondition.split('||').some(part => evaluateCondition(part.trim()));
    }
    
    // 부정 연산자 처리
    if (trimmedCondition.startsWith('!')) {
        return !evaluateCondition(trimmedCondition.substring(1));
    }
    
    // 괄호 처리
    if (trimmedCondition.includes('(') && trimmedCondition.includes(')')) {
        const innerCondition = trimmedCondition.match(/\((.*)\)/)?.[1];
        if (innerCondition) {
            return evaluateCondition(innerCondition);
        }
    }
    
    // 기본값: 알 수 없는 조건은 false로 처리
    console.warn(`Unknown condition: ${trimmedCondition}, treating as false`);
    return false;
}

// URL에서 파일을 다운로드하는 함수
async function fetchText(url: URL): Promise<string[]> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`status: ${response.status}`);
        }
        const content = await response.text();
        const text = content.trim();
        if ( text.startsWith('<') && text.endsWith('>') ) {
            throw new Error(`not a text file`);
        }
        return text.split('\n');
    } catch (error) {
        throw new Error(`Failed to fetch file from ${url}: ${error}`);
    }
}

// !#if 지시어를 처리하는 함수 (라인별 처리)
function processIfDirectives(lines: string[]): string[] {
    const processedLines: string[] = [];
    const ifStack: { condition: string; active: boolean }[] = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // !#if 지시어 처리
        if (trimmedLine.startsWith('!#if')) {
            const condition = trimmedLine.substring(4).trim();
            const isActive = evaluateCondition(condition);
            ifStack.push({ condition, active: isActive });
            continue;
        }
        
        // !#endif 지시어 처리
        if (trimmedLine === '!#endif') {
            ifStack.pop();
            continue;
        }
        
        // !#else 지시어 처리
        if (trimmedLine === '!#else') {
            if (ifStack.length > 0) {
                ifStack[ifStack.length - 1].active = !ifStack[ifStack.length - 1].active;
            }
            continue;
        }
        
        // 현재 라인이 활성화된 조건 블록 내에 있는지 확인
        const isInActiveBlock = ifStack.length === 0 || ifStack.every(block => block.active);
        
        if (isInActiveBlock) {
            processedLines.push(line);
        }
    }
    
    return processedLines;
}

// !#include 지시어를 처리하는 함수 (라인별 처리)
async function processIncludeDirectives(lines: string[], baseUrl: URL): Promise<string[]> {
    const processedLines: string[] = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // !#include 지시어 처리
        if (trimmedLine.startsWith('!#include')) {
            const includePath = trimmedLine.substring(9).trim();
            const includeUrl = includePath.startsWith('http') 
                ? new URL(includePath)
                : new URL(includePath, baseUrl);
            
            console.log(`Fetching include file: ${includeUrl.href}`);
            const includedLines = await fetchText(includeUrl);
            const processedIncludedLines = await processLines(includedLines, includeUrl);

            processedLines.push(
                `! >>>>>>>> ${includeUrl.href}`,
                ...processedIncludedLines,
                `! <<<<<<<< ${includeUrl.href}`
            );
        } else {
            processedLines.push(line);
        }
    }
    
    return processedLines;
}

// 모든 directive를 처리하는 통합 함수 (재귀적)
async function processLines(lines: string[], baseUrl: URL): Promise<string[]> {
    // 1. 먼저 !#if 지시어 처리
    const filteredLines = processIfDirectives(lines);
    
    // 2. 그 다음 !#include 지시어 처리
    const processedLines = await processIncludeDirectives(filteredLines, baseUrl);
    
    return processedLines;
}

// 로컬 파일을 읽는 함수
function readLocalFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n');
}

// 로컬 filters 디렉터리의 모든 파일을 처리하는 함수
function processLocalFilters(): string[] {
    const filtersDir = path.join(process.cwd(), 'filters');
    const localLines: string[] = [];
    
    if (!fs.existsSync(filtersDir)) {
        console.log('Local filters directory not found, skipping...');
        return localLines;
    }
    
    const files = fs.readdirSync(filtersDir);
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const filePath = path.join(filtersDir, file);
            console.log(`Reading local filter file: ${file}`);
            const lines = readLocalFile(filePath);
            localLines.push(
                `! >>>>>>>> ${filePath}`,
                ...lines,
                `! <<<<<<<< ${filePath}`
            );
        }
    }
    
    return localLines;
}

// 메인 처리 함수
async function generateFilter(outputDir: string): Promise<void> {
    const mainListUrl = new URL('https://cdn.jsdelivr.net/gh/List-KR/List-KR@latest/filter-uBlockOrigin.txt');
    
    try {
        console.log('Fetching List-KR filter...');
        const lines = await fetchText(mainListUrl);
        
        console.log('Processing lines...');
        const processedLines = await processLines(lines, mainListUrl);
        
        console.log('Processing local filters...');
        const localLines = processLocalFilters();
        
        // 최종 결과: 원격 필터 + 로컬 필터
        const finalLines = [...processedLines, ...localLines];
        
        // 출력 디렉토리가 없으면 생성
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputPath = path.join(outputDir, 'list-kr.txt');
        const finalContent = finalLines.join('\n');
        fs.writeFileSync(outputPath, finalContent, 'utf8');
        
        console.log(`Filter generated successfully: ${outputPath}`);
        console.log(`Total lines: ${finalLines.length}`);
        console.log(`Remote lines: ${processedLines.length}`);
        console.log(`Local lines: ${localLines.length}`);
        
    } catch (error) {
        console.error('Error generating filter:', error);
        process.exit(1);
    }
}

async function main() {
    const program = createCommand('filter-generator')
    .description('Generate a unified filter file from List-KR for Brave browser')
    .requiredOption('--output-dir <dir>', 'output directory for the generated filter file')
    .action(async (options) => {
        await generateFilter(options.outputDir);
    });

    await program.parseAsync(process.argv);
}
main();