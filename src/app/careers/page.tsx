import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
};

export default function CareersPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-4xl font-semibold text-white">Ethan Hicks</h1>
        {/* <p className="mb-4 text-gray-300">etmhicks@gmail.com</p> */}
        <div className="mb-10 flex flex-wrap gap-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          <a
            href="https://github.com/et-hicks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 transition hover:text-slate-200"
          >
            GitHub
            <span className="flex items-center gap-1 text-xs tracking-[0.2em] text-slate-500">
              <span aria-hidden>↗</span>
            </span>
          </a>
          <a
            href="https://www.linkedin.com/in/ethan-m-hicks/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 transition hover:text-slate-200"
          >
            LinkedIn
            <span className="flex items-center gap-1 text-xs tracking-[0.2em] text-slate-500">
              <span aria-hidden>↗</span>
            </span>
          </a>
        </div>

        {/* Career Summary */}
        <div className="mb-10">
          <p className="text-lg text-gray-200 leading-relaxed">
            A senior software engineer with 6+ years of experience building regulated financial systems, high-volume data platforms, and customer-focused products.
            Currently developing and maintaining commodities risk and regulatory reporting systems at Capital One, with a track record of scaling APIs to 1.5 billion monthly requests at JPMorgan Chase
            and helping startups grow from 2 to 8+ customers through reliable backend systems, pragmatic automation, and strong engineering mentorship.
          </p>
        </div>

        {/* Education */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-white border-b border-gray-700 pb-2">Education</h2>
          <div className="mb-4">
            <h3 className="text-xl text-white font-medium">University of California, Berkeley</h3>
            <div className="flex justify-between items-center text-gray-300 mt-1">
              <span>Bachelor of Arts in Data Science</span>
              <span>Graduated Dec 2020</span>
            </div>
          </div>
        </section>

        {/* Work Experience */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold text-white border-b border-gray-700 pb-2">Work Experience</h2>

          {/* Capital One */}
          <div className="mb-8">
            <h3 className="text-xl text-white font-medium">Senior Software Engineer</h3>
            <div className="flex justify-between items-center text-gray-300 mt-1 mb-3">
              <span>Capital One</span>
              <span>Dec 2025 - Present</span>
            </div>
            <p className="text-gray-200 mb-3 italic">
              Building and operating high-volume commodities reporting systems for risk, regulatory, and third-party reporting workflows across cloud-hosted Java services.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Develops and maintains Java microservices that generate commodities risk and regulatory reports for government-facing submissions and third-party stakeholders</li>
              <li>Owns SQL-backed trade ingestion and reporting workflows that import dozens of gigabytes of commodity trade data per day for downstream analytics and compliance use cases</li>
              <li>Operates resilient batch jobs and production APIs across AWS services including EC2, S3, Secrets Manager, and Step Functions state machines</li>
              <li>Stewards third-party vendor connectivity with Triple Point Software, supporting reliable commodity trade data exchange and reporting continuity</li>
              <li>Applies Claude and Gemini in daily engineering workflows to accelerate debugging, implementation planning, documentation, and code review readiness</li>
            </ul>
          </div>

          {/* JPMorgan Chase */}
          <div className="mb-8">
            <h3 className="text-xl text-white font-medium">Software Engineer II</h3>
            <div className="flex justify-between items-center text-gray-300 mt-1 mb-3">
              <span>JPMorgan Chase</span>
              <span>Jul 2022 - Dec 2025</span>
            </div>
            <p className="text-gray-200 mb-3 italic">
              Built fraud-resistant financial APIs at massive scale, while leading architectural improvements and mentoring junior developers.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Implements the Financial Data Exchange API standard, a user consent and permissions based financial API dealing with sensitive transactions information, with fraud-resistant systems in mind</li>
              <li>Designed and scaled a REST-based microservices platform handling 1.5 billion monthly requests with high reliability and low latency</li>
              <li>Led transition from a monolithic codebase to a Spring-based microservices architecture, cutting server costs by 50%</li>
              <li>Developed Kafka-based web-hook notification infrastructure to inform clients about consenting operations, reducing API polling loads on servers by 100%</li>
              <li>Integrated Redis-based caching mechanisms for frequent repeated REST calls, saving up to 100 milliseconds per call, resulting in thousands of dollars saved in compute costs, and better customer response times</li>
              <li>Automated Jenkins-based QA and Production CI/CD pipelines, resulting in 30+ minute faster deployment times, saving engineering headaches, and reducing time to resolution for rare production incidents</li>
              <li>Championed engineering mentorship and guided 4 interns every summer, showing them how to write and maintain production level code, more advanced features of git and linux, and facilitating a learning environment</li>
            </ul>
          </div>

          {/* theLoops.io */}
          <div className="mb-8">
            <h3 className="text-xl text-white font-medium">Java Backend Engineer</h3>
            <div className="flex justify-between items-center text-gray-300 mt-1 mb-3">
              <span>theLoops.io</span>
              <span>Apr 2021 to Jul 2022</span>
            </div>
            <p className="text-gray-200 mb-3 italic">
              Helped a growing startup expand their customer base 4x by building intelligent support operations software and optimizing data pipelines for AI-driven insights.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Created customer support operations software that increased startup customers from 2 to 8+ within a year</li>
              <li>Reduced customer operation times by 30% by implementing a customizable support operation scoring system</li>
              <li>Extracted and cleaned customer data and metadata in SQL from user behavior for machine learning team, directly increasing model training data by 50%, resulting in better AI predictions for CRM to customer interactions</li>
            </ul>
          </div>

          {/* Varty.io */}
          <div className="mb-8">
            <h3 className="text-xl text-white font-medium">Full Stack Engineer</h3>
            <div className="flex justify-between items-center text-gray-300 mt-1 mb-3">
              <span>Varty.io</span>
              <span>Mar 2020 to Apr 2021</span>
            </div>
            <p className="text-gray-200 mb-3 italic">
              Built innovative video conferencing experiences during the early pandemic, focusing on performance optimization and user engagement to drive initial product sales.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Developed AWS EC2 instances running Node.js and Python to reduce client-side computing requirements by over 50%</li>
              <li>Built interactive frontend experiences with WebRTC, React and PixiJS for a real-time video conferencing product</li>
              <li>Extracted user insights to drive product-market fit for hosts in niche verticals, leading to first product sales</li>
            </ul>
          </div>
        </section>

        {/* Languages and Skills */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white border-b border-gray-700 pb-2">Languages and Skills</h2>
          <div className="space-y-3">
            <p className="text-gray-300">
              <span className="text-white font-semibold">Technology:</span> Java, Spring, Go, Python, SQL, MySQL, Kafka, React, JavaScript, PixiJS, WebRTC
            </p>
            <p className="text-gray-300">
              <span className="text-white font-semibold">Architecture & Infra:</span> Microservices, REST APIs, batch processing, AWS, EC2, S3, Secrets Manager, Step Functions, Jenkins, Terraform
            </p>
            <p className="text-gray-300">
              <span className="text-white font-semibold">Collaboration:</span> Cross-functional teamwork, Agile, technical mentorship, vendor integrations, Claude, Gemini
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
