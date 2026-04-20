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
