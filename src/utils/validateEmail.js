import { validateDisposable } from './disposableCheck.js';
import mailcheck from 'mailcheck';
import { roleKeywords } from './roleKeywords';

export async function validateEmail(email) {
    let score = 0;
    const domain = email.split('@')[1];
    const [username] = email.split('@');

    // 1. Check syntax, score: 5
    const checkSyntaxError = (val) => !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);

    const syntax_error = checkSyntaxError(email);

    if (!syntax_error) {
        score += 5;
    } else {
        return {
            score: 0,
            syntax_error,
            gibberish: null,
            role: null,
            did_you_mean: null,
            disposable: null,
        };
    }

    // 2. Check if email is gibberish, score: 5
    const isGibberishEmail = () => {
        const hasExcessiveNumbers = (username.match(/\d/g) || []).length / username.length > 0.5;
        const hasRandomPattern = /^[a-zA-Z0-9]{8,}$/.test(username);
        const isRandomSequence = /^[a-zA-Z0-9]+$/.test(username) && !/^[a-zA-Z]+$/.test(username);
        return username.length > 8 && (hasExcessiveNumbers || hasRandomPattern || isRandomSequence);
    };

    const gibberish = isGibberishEmail();
    if (!gibberish) {
        score += 5;
    } else {
        score -= 5;
    }

    // 3. Check typos, score: 5
    let did_you_mean = null;
    mailcheck.run({
        email: email,
        defaultTopLevelDomains: [domain],
        suggested: (suggestion) => {
            did_you_mean = suggestion.full;
        },
        empty: () => null,
    });
    if (!did_you_mean) {
        score += 5;
    }

    // 4. Check if email is role-based, score: 5
    const isRoleEmail = () => roleKeywords.some((role) => username.toLowerCase().includes(role));
    const roleBased = isRoleEmail(username);
    if (!roleBased) {
        score += 5;
    }

    // 5. Check disposable, score: 15
    const disposableCheck = await validateDisposable(email);
    if (disposableCheck) {
        score += 15;
    } else {
        score -= 15;
    }

    return {
        score,
        syntax_error,
        gibberish,
        role: roleBased,
        did_you_mean,
        disposable: !disposableCheck,
    };
}
