import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "How accurate is the AI scoring?",
      answer: "HireIQ uses a customized LangGraph state graph powered by high-context LLMs. This forces the AI into a deterministic workflow, ensuring consistent, transparent scoring that is tied directly to the requirements in your Job Description."
    },
    {
      question: "Is candidate data stored securely?",
      answer: "Yes. All data is persisted securely using Supabase. In a production environment, Row Level Security (RLS) is enabled to ensure recruiters can only access their own pipelines."
    },
    {
      question: "Can I customize the outreach emails?",
      answer: "Absolutely. HireIQ generates a highly personalized first draft based on the candidate's unique strengths, but you can always edit it in your email client before hitting send."
    },
    {
      question: "Do I need technical skills to use this?",
      answer: "Not at all! If you can copy and paste text into a box, you can use HireIQ. The complex AI orchestration happens entirely behind the scenes."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Questions?</h2>
          <h3 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h3>
        </div>

        <Accordion type="single" collapsible="true" className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b-slate-200">
              <AccordionTrigger className="text-left text-lg font-medium text-slate-800 hover:text-indigo-600 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed text-base pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
