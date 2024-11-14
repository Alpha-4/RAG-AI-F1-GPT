import React from 'react'
import PromptSuggestionButton from './PromptSuggestionButton';

const PromptSuggestionsRow = ({onPromptClick}) => {
    const prompts = [
        "When was the inaugural Formula One season held?",
        "Which governing body sanctions Formula One races?",
        "How many points are awarded to the winner of a Formula One race (as of 2024)?",
        "What does a red flag during an F1 race indicate?",
        "Which team holds the record for most Formula One World Constructors' Championships (as of June 2024)?"
    ];
    return (
        <div className='prompt-suggestion-row'>
            {
                prompts.map((prompt, index) => (<PromptSuggestionButton key={"suggestion" + index} text={prompt} onClick={onPromptClick} />))
            }
        </div>
    )
}

export default PromptSuggestionsRow