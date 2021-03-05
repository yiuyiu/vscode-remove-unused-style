import { parse } from '@babel/parser';
import { File, DECLARATION_TYPES, CallExpression, MemberExpression, Identifier, ObjectExpression, ObjectProperty } from '@babel/types';
import generator from '@babel/generator';
import { property } from "lodash";
import { ExtensionContext, commands, workspace, TextEditor, TextDocument, TextEditorEdit, Position, Range } from 'vscode';
function findIfExist(text: string, symbol: string) {
    return text.indexOf(symbol) > -1;
}
function getStyleName(ast: File): { styleName: string, stylePropContainer: ObjectExpression | null } {
    let styleName = '';
    let stylePropContainer: ObjectExpression | null = null;
    ast.program.body.forEach(item => {
        if (item.type === 'VariableDeclaration') {
            item.declarations?.forEach(dec => {
                if (dec.type === 'VariableDeclarator') {
                    const init = dec.init as CallExpression;
                    const callee = init?.callee as MemberExpression;
                    const obj = callee?.object as Identifier;
                    const property = callee?.property as Identifier;
                    if (obj.name === 'StyleSheet' && property.name === 'create') {
                        const id = dec.id as Identifier;
                        styleName = id.name;
                        const args = init.arguments as [ObjectExpression];
                        stylePropContainer = args[0];
                    }
                }
            });
        }
    });
    return {
        styleName,
        stylePropContainer
    };
}
// function changeStyleObj(stylePropContainer: ObjectExpression | null, styleName: string, text: string) {
//     const arr: ObjectProperty[] = [];
//     const properties = stylePropContainer?.properties as [ObjectProperty];
//     properties.forEach(item => {
//         const key = item.key as Identifier;
//         if (findIfExist(text, `${styleName}.${key}`)) {
//             arr.push(item);
//         }
//     });
//     stylePropContainer && (stylePropContainer.properties = arr);
// }
function getToBeDeletedLineRange(stylePropContainer: ObjectExpression | null, styleName: string, text: string) {
    const arr: any = [];
    const properties = stylePropContainer?.properties as [ObjectProperty];
    properties.forEach(item => {
        const key = item.key as Identifier;
        if (!findIfExist(text, `${styleName}.${key.name}`)) {
            arr.push([item.loc?.start.line, item.loc?.end.line]);
        }
    });
    return arr;
}
function applyDelete(toBeDeleteLines: any, editor: TextEditor, document: TextDocument) {
    editor.edit(edit => {
        toBeDeleteLines?.forEach((item: any) => {
            for (let i = item[0]; i <= item[1]; i++) {
                // i range from 1, lineAt range from 0
                const line = document.lineAt(i - 1);
                edit.delete(line.rangeIncludingLineBreak);
            }
        });
    });
}
export default function removeUnusedCss(editor: TextEditor, edit: TextEditorEdit): void {
    const { document } = editor;
    const text = document.getText();
    const ast = parse(text, {
        sourceType: "module",
        plugins: ["jsx"]
    });
    const { styleName, stylePropContainer } = getStyleName(ast);
    applyDelete(getToBeDeletedLineRange(stylePropContainer, styleName, text), editor,
        document);
}