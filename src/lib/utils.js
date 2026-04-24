import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatTitleCase(str) {
    if (!str) return '';
    const ignoreWords = ['de', 'da', 'do', 'das', 'dos', 'di', 'du', 'com', 'e', 'ou', 'para', 'por', 'em', 'um', 'uma', 'os', 'as', 'no', 'na', 'nos', 'nas', 'sem'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (index > 0 && ignoreWords.includes(word)) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export const maskCurrency = (value) => {
    if (value === undefined || value === null || value === '') return "0,00";
    let val = value;
    // Se for número, transforma em centavos (ex: 10.5 -> 1050)
    if (typeof val === 'number') {
        val = Math.round(val * 100).toString();
    }
    let v = val.toString().replace(/\D/g, "");
    v = (parseInt(v || "0") / 100).toFixed(2).replace(".", ",");
    v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return v;
};

export const parseCurrency = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    // Limpa tudo que não é dígito e trata como centavos
    const cleanValue = value.toString().replace(/\D/g, "");
    return parseInt(cleanValue || "0") / 100;
};
