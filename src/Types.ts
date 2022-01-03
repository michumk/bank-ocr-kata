export enum NumberDigit {
    ZERO = '0',
    ONE = '1',
    TWO = '2',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    SIX = '6',
    SEVEN = '7',
    EIGHT = '8',
    NINE = '9',
    UNKNOWN = '?'
}

// this type is to help recognise representations of numbers in a string
export type NumberFigure = string

export const NumberFigures = {
    [NumberDigit.ZERO]:
    ' _ ' +
    '| |' +
    '|_|',

    [NumberDigit.ONE]:
    '   ' +
    '  |' +
    '  |',

    [NumberDigit.TWO]:
    ' _ ' +
    ' _|' +
    '|_ ',

    [NumberDigit.THREE]:
    ' _ ' +
    ' _|' +
    ' _|',

    [NumberDigit.FOUR]:
    '   ' +
    '|_|' +
    '  |',

    [NumberDigit.FIVE]:
    ' _ ' +
    '|_ ' +
    ' _|',

    [NumberDigit.SIX]:
    ' _ ' +
    '|_ ' +
    '|_|',

    [NumberDigit.SEVEN]:
    ' _ ' +
    '  |' +
    '  |',

    [NumberDigit.EIGHT]:
    ' _ ' +
    '|_|' +
    '|_|',

    [NumberDigit.NINE]:
    ' _ ' +
    '|_|' +
    ' _|'
}

export interface Result {
    entryPreview: string,
    accountNumber: NumberDigit[],
    status?: 'ILL' | 'ERR' | 'AMB',
    replacements?: NumberDigit[][]
}
