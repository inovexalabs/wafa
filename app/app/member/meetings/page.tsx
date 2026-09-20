import MemberLayout from "../../../components/member-layout";

const meetings = [
	{
		day: "18",
		month: "SEP",
		title: "Design sync",
		detail: "10:00 AM · Meeting room 2",
		type: "Team meeting",
		tone: "green",
	},
	{
		day: "22",
		month: "SEP",
		title: "All-hands meeting",
		detail: "2:00 PM · Main conference",
		type: "Company",
		tone: "purple",
	},
	{
		day: "29",
		month: "SEP",
		title: "Monthly member forum",
		detail: "4:00 PM · Online",
		type: "Member forum",
		tone: "orange",
	},
];

export default function MeetingsPage() {
	return (
		<MemberLayout active="meetings">
			<main className="member-content section-page">
				<div className="section-heading">
					<div>
						<p className="eyebrow form-eyebrow">Your calendar</p>
						<h1>Meetings</h1>
						<p>Stay prepared for what&apos;s coming up.</p>
					</div>
					<button className="primary-action">＋ Add to calendar</button>
				</div>
				<section className="member-card page-card">
					<div className="card-heading">
						<div>
							<h2>Upcoming meetings</h2>
							<p>September 2026</p>
						</div>
						<button className="text-action">Month view →</button>
					</div>
					<div className="meeting-list">
						{meetings.map((meeting) => (
							<article className="meeting-row" key={meeting.title}>
								<span className={"event-date " + meeting.tone}>
									<b>{meeting.day}</b>
									<small>{meeting.month}</small>
								</span>
								<div>
									<strong>{meeting.title}</strong>
									<p>{meeting.detail}</p>
									<span className="meeting-type">{meeting.type}</span>
								</div>
								<button className="outline-action">View details</button>
							</article>
						))}
					</div>
				</section>
			</main>
		</MemberLayout>
	);
}
