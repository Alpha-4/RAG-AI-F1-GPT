"use client"

import {useChat} from 'ai/react'
import {Message} from "ai";
import Logo from "./assets/f1-formula.jpg";

import Image from 'next/image';
import PromptSuggestionsRow from './components/PromptSuggestionsRow';
import LoadingBubble from './components/LoadingBubble';
import Bubble from './components/Bubble';

const Home = () => {
    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();
    const noMessage = !messages || messages.length === 0;

    const handlePromptClick = (promptText) => {
        const msg: Message = {
            id: crypto.randomUUID.toString(),
            content: promptText,
            role: "user",
        }

        append(msg)
    }

    return (
        <main>
            <Image src={Logo} alt="f1-logo" width={150} height={100} />
            <section className={noMessage ? "" : "populated"}>
                {
                    noMessage ? (
                        <>
                            <p>Ask me anything about Formula 1</p>
                            <br />
                            {
                                <PromptSuggestionsRow onPromptClick={handlePromptClick} />
                            }
                        </>
                    ) : (
                        <>
                            {messages.map((message, index) => (<Bubble key={'message-' + index} message={message} />))}
                            {isLoading && <LoadingBubble />}
                        </>
                    )
                }

            </section>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Ask me anything about Formula 1"
                    className="question-box" onChange={handleInputChange} value={input} />
                <input type="submit" />
            </form>
        </main >
    )
}

export default Home