export default function JobCard({ job }) {
  return (
    <article className="rounded-xl border border-[#e5ebe5] bg-[#fbfdfb] p-4 text-[#30443a]">
      <h3 className="font-semibold">{job.title || "Job opportunity"}</h3>
      {(job.company || job.location) && (
        <p className="mt-1 text-xs text-[#718078]">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
      )}
      {(job.employment_type || job.posted_date) && (
        <p className="mt-2 text-xs text-[#52675b]">
          {[job.employment_type, job.posted_date].filter(Boolean).join(" · ")}
        </p>
      )}
      {job.required_skills && (
        <p className="mt-2 text-xs text-[#52675b]">Skills: {job.required_skills}</p>
      )}
      {job.salary && <p className="mt-2 text-xs text-[#52675b]">Salary: {job.salary}</p>}
      {typeof job.apply_link === "string" &&
        /^https?:\/\//i.test(job.apply_link) && (
          <a
            className="mt-3 inline-flex rounded-lg bg-[#174f3b] px-3 py-2 text-xs font-semibold text-white no-underline hover:bg-[#103d2c]"
            href={job.apply_link}
            target="_blank"
            rel="noreferrer"
          >
            Apply
          </a>
        )}
    </article>
  );
}
