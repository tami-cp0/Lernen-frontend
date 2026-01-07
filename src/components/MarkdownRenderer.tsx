'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
	content: string;
	className?: string;
}

export default function MarkdownRenderer({
	content,
	className = '',
}: MarkdownRendererProps) {
	return (
		<div
			className={`prose prose-invert max-w-full break-words overflow-hidden ${className}`}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					// Customize code blocks
					code: ({ className, children, ...props }) => {
						const match = /language-(\w+)/.exec(className || '');
						const isInline = !match;

						if (isInline) {
							return (
								<code
									className="bg-zinc-800 text-primary px-1.5 py-0.5 rounded text-xs!"
									{...props}
								>
									{children}
								</code>
							);
						}

						return (
							<code className={`${className} text-sm`} {...props}>
								{children}
							</code>
						);
					},
					// Customize pre blocks (code blocks container)
					pre: ({ children }) => (
						<pre className="bg-zinc-900 p-0 rounded-lg overflow-x-hidden my-3 max-w-full text-xs">
							{children}
						</pre>
					),
					// Customize paragraphs
					p: ({ children }) => (
						<p className="mb-3 last:mb-0">{children}</p>
					),
					// Customize headings
					h1: ({ children }) => (
						<h1 className="text-2xl font-bold mb-3 mt-4">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-xl font-bold mb-3 mt-4">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-lg font-bold mb-2 mt-3">
							{children}
						</h3>
					),
					// Customize lists
					ul: ({ children }) => (
						<ul className="list-disc list-inside mb-3 space-y-1">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal list-inside mb-3 space-y-1">
							{children}
						</ol>
					),
					// Customize links
					a: ({ children, href }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							{children}
						</a>
					),
					// Customize blockquotes
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-primary pl-4 italic my-3">
							{children}
						</blockquote>
					),
					// Customize tables
					table: ({ children }) => (
						<div className="overflow-x-auto my-3">
							<table className="min-w-full border-collapse border border-zinc-700">
								{children}
							</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border border-zinc-700 px-3 py-2 bg-zinc-800 font-semibold text-left">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-zinc-700 px-3 py-2">
							{children}
						</td>
					),
					// Customize horizontal rules
					hr: () => <hr className="border-t border-zinc-700 my-6" />,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
