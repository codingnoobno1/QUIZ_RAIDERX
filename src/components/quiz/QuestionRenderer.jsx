import React from "react";
import { Typography, Box } from "@mui/material";
import MCQQuestion from "./questions/MCQQuestion";
import FillUpQuestion from "./questions/FillUpQuestion";
import TrueFalseQuestion from "./questions/TrueFalseQuestion";
import CodeQuestion from "./questions/CodeQuestion";

export default function QuestionRenderer({ question, onAnswer, value }) {
    if (!question) return null;

    let Component;

    switch (question.type) {
        case "mcq":
            Component = MCQQuestion;
            break;
        case "fillup":
        case "findoutput":
            Component = FillUpQuestion;
            break;
        case "truefalse":
            Component = TrueFalseQuestion;
            break;
        case "simplecode":
        case "blockcode":
        case "testcasecode":
            Component = CodeQuestion;
            break;
        default:
            return <Typography color="error">Unknown question type: {question.type}</Typography>;
    }

    return (
        <Box>
            <Component question={question} onAnswer={onAnswer} value={value} />
        </Box>
    );
}
