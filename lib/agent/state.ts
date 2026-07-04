import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export const AgentAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentAnnotation.State;
