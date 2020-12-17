export interface Protocol {
}

export interface Registry<T> extends Map<T, string>, Protocol {
}