/* eslint-disable no-inner-declarations */
import { ChatState, ITool } from "chat-list/types/plugin";
import description from './prompts/description.md';
import scriptDescription from './prompts/script-description.md';
import { buildChatMessage, extractCodeFromMd } from "chat-list/utils";
import { createXlsxFile, prepareFolder, writeFile, runFunction, readFilesToData, convertFileToMark, initEnv } from '../util';


/**
 * Code generation and run it in Python
 */
export const func = async ({ active_sheet, script, explain, context }: { active_sheet: string, script: string, explain: string, context: ChatState }) => {
    // const code = extractCodeFromMd(script);
    if (!script) {
        return `Sorry! I can't generate the script code`;
    }
    const { appendMsg } = context;

    const code = extractCodeFromMd(script);
    const resMsg = buildChatMessage(`${explain}\n\`\`\`python\n${code}\n\`\`\``, 'text');
    appendMsg(resMsg);

    const wboutArrayBuffer = await createXlsxFile(active_sheet);
    await prepareFolder(['/input'], false);
    await prepareFolder(['/output'], true);
    await writeFile('/input/data.xlsx', wboutArrayBuffer);
    const result = await runFunction(code, 'main');
    const fileData = await readFilesToData('/output');
    const fileContents = await convertFileToMark(fileData);
    if (!fileContents || fileContents.length <= 0) {
        return `Script run completed, here is execution result:\n\n${result}`;
    }
    let allResults = '';
    for (let i = 0; i < fileContents.length; i++) {
        const { name, content } = fileContents[i];
        const resMsg = buildChatMessage(`**${name}**\n\n${content}\n\n`, 'text');
        context?.appendMsg(resMsg);
        allResults += `**${name}**\n\n${content}\n\n`;
    }
    return `Task completed, here is execution result:\n\n${allResults}`;

};

export default {
    type: 'function',
    name: 'python_calculator',
    description,
    parameters: {
        "type": "object",
        "properties": {
            "active_sheet": {
                "type": "string",
                "description": "Active sheet name",
            },
            "script": {
                "type": "string",
                "description": scriptDescription
            },
            'explain': {
                "type": "string",
                "description": `Explain the python code`
            },
        },
        "required": ["active_sheet", 'script', 'explain']
    },
    func
} as unknown as ITool;
