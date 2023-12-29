export type DictionaryKey = string | number | symbol;
export type Dictionary<K extends DictionaryKey, V> = {
	[key in K]: V;
};

