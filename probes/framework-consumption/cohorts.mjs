// One maintained selection for preparation and browser discovery. Versions live
// in each environment's manifest/lock; historical receipts are never rewritten.
export const cohorts = [
 {id:'html',family:'html',classification:'native-baseline'},
 {id:'react19',family:'react',classification:'current-minor'},
 {id:'react192',family:'react',classification:'preceding-minor'},
 {id:'react18',family:'react',classification:'previous-major-compatibility'},
 {id:'vue3',family:'vue',classification:'current-minor'},
 {id:'vue34',family:'vue',classification:'preceding-minor'},
 {id:'vue2',family:'vue',classification:'historical-eol-compatibility'},
 {id:'svelte5',family:'svelte',classification:'current-minor'},
 {id:'svelte556',family:'svelte',classification:'preceding-minor'},
 {id:'svelte4',family:'svelte',classification:'previous-major-compatibility'},
];
