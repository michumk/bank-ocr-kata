import fs = require('fs')
import _ = require('lodash')
import { NumberDigit, NumberFigure, NumberFigures, Result } from './Types'

export default class AccountNumberParser {
    private readonly pipeIndexes = [3, 5, 6, 8]
    private readonly underscoreIndexes = [1, 4, 7]
    private readonly viableIndexes = [
        ...this.pipeIndexes,
        ...this.underscoreIndexes
    ]
    private data = ''

    // step 1: divide whole input into separate entries
    private get entries (): string[][] {
        const lines = this.data.split(/\n/)
        const entries: string[][] = []

        for (let i = 0; i < lines.length; i += 4) {
            // make sure every line is 27 chars long
            entries.push([
                    lines[i],
                    lines[i + 1],
                    lines[i + 2]
                ].map(line => line + ' '.repeat(27 - line.length))
            )
        }

        return entries
    }

    // step 2: convert entries into arrays of NumberFigures
    private get entriesParsed (): NumberFigure[][] {
        return this.entries.map(entry => {
            const numberFigures: string[] = []

            for (let i = 0; i < 27; i += 3) {
                numberFigures.push(
                    entry[0].slice(i, i + 3) +
                    entry[1].slice(i, i + 3) +
                    entry[2].slice(i, i + 3)
                )
            }

            return numberFigures
        })
    }

    public loadFile (filePath: string): this {
        this.data = fs.readFileSync(filePath, 'utf8')
        return this
    }

    public parseFile (): this {
        this.entriesParsed.forEach((entry, index) => {
            console.log(this.getResult(entry, index))
        })
        return this
    }

    private getNumberDigitForNumberFigure (numberFigure: NumberFigure): NumberDigit {
        const numberDigit = _.findKey(NumberFigures, value => value === numberFigure)
        return (numberDigit ?? NumberDigit.UNKNOWN) as NumberDigit
    }

    private getNumberDigitsFromEntry (entry: NumberFigure[]): NumberDigit[] {
        return entry.map(numberFigure => {
            return this.getNumberDigitForNumberFigure(numberFigure)
        })
    }

    private isUnfixableAccountNumber (accountNumber: NumberDigit[]): boolean {
        return 1 < accountNumber.reduce((unknownDigits: number, currNumberDigit) => {
            return currNumberDigit === NumberDigit.UNKNOWN
                ? unknownDigits + 1
                : unknownDigits
        }, 0)
    }

    private isLegibleAccountNumber (accountNumber: NumberDigit[]): boolean {
        return accountNumber.every(numberDigit => numberDigit !== NumberDigit.UNKNOWN)
    }

    private isValidAccountNumber (accountNumber: NumberDigit[]): boolean {
        if (!this.isLegibleAccountNumber(accountNumber)) return false

        const sum = [...accountNumber].reverse().reduce((sum: number, currNumberDigit, index) => {
            const value = parseInt(currNumberDigit)
            const multiplier = index + 1
            return sum + (value * multiplier)
        }, 0)

        return sum % 11 === 0
    }

    private switchCharacter (numberFigure: NumberFigure, index: number): NumberFigure {
        const replacement = this.pipeIndexes.includes(index)
            ? numberFigure[index] !== '|' ? '|' : ' '
            : numberFigure[index] !== '_' ? '_' : ' '

        return numberFigure.substring(0, index) + replacement + numberFigure.substring(index + 1)
    }

    private getMutationsForNumberFigure (numberFigure: NumberFigure): NumberDigit[] {
        return this.viableIndexes.reduce((numberDigitMutations: NumberDigit[], currIndex) => {
            const numberFigureMutation = this.switchCharacter(numberFigure, currIndex)
            const numberDigit = this.getNumberDigitForNumberFigure(numberFigureMutation)

            if (numberDigit !== NumberDigit.UNKNOWN) {
                numberDigitMutations.push(numberDigit)
            }

            return numberDigitMutations
        }, [])
    }

    private getValidAccountNumbersForNumberDigitMutations (
        numberDigitMutations: NumberDigit[],
        accountNumber: NumberDigit[],
        numberDigitIndex: number
    ): NumberDigit[][] {
        return numberDigitMutations.reduce((
            accountNumberReplacements: NumberDigit[][],
            numberDigitMutation
        ) => {
            const newAccountNumber = _.cloneDeep(accountNumber)
            newAccountNumber[numberDigitIndex] = numberDigitMutation

            if (this.isValidAccountNumber(newAccountNumber)) {
                accountNumberReplacements.push(newAccountNumber)
            }

            return accountNumberReplacements
        }, [])
    }

    private getReplacementsForIllegibleAccountNumber (
        entry: NumberFigure[],
        accountNumber: NumberDigit[]
    ): NumberDigit[][] {
        const numberDigitIndex = accountNumber.indexOf(NumberDigit.UNKNOWN)
        const numberDigitMutations = this.getMutationsForNumberFigure(entry[numberDigitIndex])

        return this.getValidAccountNumbersForNumberDigitMutations(
            numberDigitMutations,
            accountNumber,
            numberDigitIndex
        )
    }

    private getReplacementsForInvalidAccountNumber (
        entry: NumberFigure[],
        accountNumber: NumberDigit[]
    ): NumberDigit[][] {
        return entry.reduce((
            accountNumberReplacements: NumberDigit[][],
            numberFigure,
            numberDigitIndex
        ) => {
            const numberDigitMutations = this.getMutationsForNumberFigure(numberFigure)
            const validAccountNumbers = this.getValidAccountNumbersForNumberDigitMutations(
                numberDigitMutations,
                accountNumber,
                numberDigitIndex
            )

            accountNumberReplacements.push(...validAccountNumbers)
            return accountNumberReplacements
        }, [])
    }

    private getResult (entry: NumberFigure[], index: number): string {
        const result: Result = {
            entryPreview: this.entries[index].join('\n'),
            accountNumber: this.getNumberDigitsFromEntry(entry)
        }

        // there are more than 1 unknown character
        if (this.isUnfixableAccountNumber(result.accountNumber)) {
            result.status = 'ILL'
            return this.stringifyResult(result)
        }

        // check status of account number
        if (!this.isLegibleAccountNumber(result.accountNumber)) {
            result.status = 'ILL'
        } else if (!this.isValidAccountNumber(result.accountNumber)) {
            result.status = 'ERR'
        }

        // account number is valid at this point
        if (!result.status) {
            return this.stringifyResult(result)
        }

        // try to replace one broken character
        if (result.status === 'ILL') {
            result.replacements = this.getReplacementsForIllegibleAccountNumber(entry, result.accountNumber)
        }

        // try to find possible replacements for all characters
        if (result.status === 'ERR') {
            result.replacements = this.getReplacementsForInvalidAccountNumber(entry, result.accountNumber)
        }

        // we found exact one replacement
        if (result.replacements?.length === 1) {
            result.status = undefined
            result.accountNumber = result.replacements[0]
        }

        // we have multiple possible replacements
        if (result.replacements?.length > 1) {
            result.status = 'AMB'
        }

        return this.stringifyResult(result)
    }


    private stringifyResult ({ entryPreview, accountNumber, status, replacements }: Result): string {
        const replacementsParsed = replacements?.length > 1
            ? `[${replacements.map(replacement => replacement.join('')).join(', ')}]`
            : ''

        return (
            `${entryPreview} \n` +
            `=> ${accountNumber.join('')} ${status ?? ''} ${replacementsParsed} \n`
        )
    }
}
