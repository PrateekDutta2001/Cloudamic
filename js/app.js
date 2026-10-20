var SERVICES = window.SERVICES;
var WIDER = window.WIDER;
var byId = {};
for (var i = 0; i < SERVICES.length; i++) byId[SERVICES[i].id] = SERVICES[i];

var TABS = [
  ["architecture", "Generic architecture"],
  ["services", "Services"],
  ["ai", "AI specific services"],
  ["pipeline", "Deployment pipeline"],
  ["scalability", "Scalability"]
];

var ALIAS = {
  overview: "architecture",
  catalog: "services",
  "lambda-web": "services",
  agentic: "ai",
  deploy: "pipeline",
  decisions: "pipeline",
  checklist: "pipeline",
  scale: "scalability"
};

var state = {
  route: "architecture",
  serviceId: null,
  query: "",
  category: "All",
  selected: "lambda",
  keepScroll: false
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isAi(service) { return service.category === "AI"; }

function homeFor(service) { return isAi(service) ? "ai" : "services"; }

function go(route, extra) {
  location.hash = extra ? "#/" + route + "/" + extra : "#/" + route;
}

function parseHash() {
  var raw = (location.hash || "#/architecture").replace(/^#\/?/, "");
  var bits = raw.split("/");
  var route = bits[0] || "architecture";
  var arg = bits[1] || null;
  if (route === "service" && arg && byId[arg]) {
    go(homeFor(byId[arg]), arg);
    return;
  }
  if (ALIAS[route]) route = ALIAS[route];
  var known = false;
  for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === route) known = true;
  if (!known) route = "architecture";
  state.route = route;
  state.serviceId = null;
  if ((route === "services" || route === "ai") && arg) {
    var service = byId[arg];
    if (!service) return;
    if (homeFor(service) !== route) {
      go(homeFor(service), service.id);
      return;
    }
    state.serviceId = service.id;
  }
}

function arrow(label) {
  return '<div class="join" aria-hidden="true"><svg width="24" height="28" viewBox="0 0 24 28" focusable="false"><path d="M12 0v18" stroke="#e0b56a" stroke-width="2" fill="none"/><path d="M5 16l7 10 7-10" fill="#e0b56a"/></svg><span>' + escapeHtml(label) + "</span></div>";
}

function nodeButton(id) {
  var service = byId[id];
  if (!service) return "";
  var shortName = service.name.replace(/^Amazon /, "").replace(/^AWS /, "");
  var active = state.selected === id ? " active" : "";
  return '<button type="button" class="node' + active + '" data-node="' + id + '">' + escapeHtml(shortName) + "</button>";
}

function lane(name, ids, notes) {
  var html = '<div class="lane"><p class="lane-name">' + escapeHtml(name) + '</p><div class="nodes">';
  for (var i = 0; i < ids.length; i++) html += nodeButton(ids[i]);
  if (notes) {
    for (var n = 0; n < notes.length; n++) html += '<span class="arch-note">' + escapeHtml(notes[n]) + "</span>";
  }
  html += "</div></div>";
  return html;
}

function schematic(caption, rows) {
  var html = '<figure class="schematic"><figcaption>' + escapeHtml(caption) + "</figcaption>";
  for (var i = 0; i < rows.length; i++) {
    if (i > 0) html += arrow(rows[i].via || "connects");
    html += lane(rows[i].name, rows[i].ids || [], rows[i].notes || []);
  }
  html += "</figure>";
  return html;
}

function flowList(steps, wide) {
  var html = '<ol class="flow' + (wide ? " wide" : "") + '">';
  for (var i = 0; i < steps.length; i++) {
    html += '<li data-n="' + (i + 1) + '"><strong>' + escapeHtml(steps[i][0]) + "</strong><span>" + escapeHtml(steps[i][1]) + "</span></li>";
  }
  html += "</ol>";
  return html;
}

function table(headers, rows) {
  var html = '<div class="table-wrap"><table><thead><tr>';
  for (var h = 0; h < headers.length; h++) html += "<th>" + escapeHtml(headers[h]) + "</th>";
  html += "</tr></thead><tbody>";
  for (var r = 0; r < rows.length; r++) {
    html += "<tr>";
    for (var c = 0; c < rows[r].length; c++) html += "<td>" + escapeHtml(rows[r][c]) + "</td>";
    html += "</tr>";
  }
  html += "</tbody></table></div>";
  return html;
}

function selectedPanel() {
  var service = byId[state.selected] || byId.lambda;
  return '<aside class="panel"><div class="meta">' + escapeHtml(service.category) + " · click any box in the diagram</div><h3>" + escapeHtml(service.name) + "</h3><p>" + escapeHtml(service.scenario) + '</p><div class="actions"><button type="button" class="btn" data-open="' + service.id + '">Open full brief</button></div></aside>';
}

function renderArchitecture() {
  return ''
    + '<h2 class="page-title">Generic architecture</h2>'
    + '<p class="lede">This is the production shape of Harbor Claims, a property-claims copilot. The diagram is the system: browsers stop at the edge, the model never receives a database password, and a payment over the limit leaves the agent and waits for a person.</p>'
    + schematic("Architecture diagram — one adjuster question, seven planes", [
      { name: "1 · Clients", ids: [], notes: ["Adjuster browser", "Field web", "Synthetic canary"] },
      { name: "2 · Edge", via: "HTTPS", ids: ["route53", "cloudfront", "waf", "s3"] },
      { name: "3 · Identity and API", via: "JWT", ids: ["cognito", "apigateway", "verified-permissions"] },
      { name: "4 · Application tier", via: "invoke", ids: ["lambda", "lambda-web-adapter", "appconfig"] },
      { name: "5 · Agent plane", via: "IAM, not the user token", ids: ["agentcore-runtime", "bedrock", "agentcore-gateway", "agentcore-policy", "guardrails", "agentcore-memory", "knowledge-bases"] },
      { name: "6 · Systems of record and side effects", via: "tool call", ids: ["ecs", "elb", "aurora", "dynamodb", "textract", "step-functions", "sqs"] },
      { name: "7 · Prove it later", via: "traces and audits", ids: ["cloudwatch", "agentcore-observability", "agentcore-evaluations", "cloudtrail", "agent-registry", "budgets"] }
    ])
    + selectedPanel()
    + '<div class="section-h"><h3>Working flow of one question</h3><p>An adjuster asks whether the wind deductible applies, and what similar roofs paid. Follow the same boxes from top to bottom.</p></div>'
    + flowList([
      ["Browser", "The adjuster posts one message to claims.example. There are no AWS keys in the page."],
      ["Edge", "Route 53 resolves to CloudFront. WAF rate-limits. The HTML is cached. The chat POST is not."],
      ["Token", "API Gateway checks the Cognito JWT and the adjuster scope. A missing scope never starts Lambda."],
      ["Authorization", "The Lambda BFF asks Verified Permissions. A restricted claim stops here, before the model."],
      ["Stream opens", "Lambda, or the same FastAPI app behind the Lambda Web Adapter, calls the runtime with its own IAM role."],
      ["Plan", "AgentCore Runtime calls Bedrock with a pinned model and the tool list from the gateway."],
      ["Retrieve", "The gateway runs a knowledge-base retrieval over the curated policy library and returns citations."],
      ["Read the claim", "A second tool calls the private claims API. That API reads Aurora and returns a few fields."],
      ["Guard", "Policy and Guardrails inspect the tool result outside the agent process."],
      ["Money stops", "Under the threshold a draft can be prepared. Over it, Step Functions waits for a senior adjuster."],
      ["Remember", "The session is stored in Memory under that adjuster’s namespace, with an expiry."],
      ["Answer", "Tokens stream back through Lambda to the browser. Citations stay attached to the answer."]
    ])
    + '<div class="section-h"><h3>Connection rules</h3><p>The arrows that are allowed, and the ones that must not exist.</p></div>'
    + table(
      ["From", "To", "How", "Never"],
      [
        ["Browser", "CloudFront", "HTTPS, Cognito bearer token", "AWS credentials, function URL, or a direct runtime URL"],
        ["API Gateway", "Lambda BFF", "JWT already checked, response streaming", "A 29-second buffered call for a tool-using turn"],
        ["Lambda", "AgentCore Runtime", "IAM SigV4 on one runtime ARN", "Forwarding the user JWT"],
        ["Runtime", "Bedrock", "Pinned model ID through the VPC endpoint", "A browser key or an unbounded max-token setting"],
        ["Runtime", "Tools", "AgentCore Gateway only", "A connection string, a shell, or a model-chosen URL"],
        ["Gateway", "Claims API", "Private ALB, service identity", "The model querying Aurora itself"],
        ["Payment tool", "Step Functions", "Callback task, human approval", "The model marking a payment successful"],
        ["Everyone", "S3 claim files", "KMS, prefix-scoped, TLS", "A public bucket or a long-lived pre-signed URL"]
      ]
    )
    + '<div class="section-h"><h3>Worked example</h3></div>'
    + '<div class="prose"><p>Priya, an adjuster in the west region, opens claim 184422 after a hailstorm. She asks, “Does the cosmetic-roof exclusion apply after the 2024 bulletin, and what is the wind deductible?” CloudFront serves the app. API Gateway accepts her token. Verified Permissions allows her region. The runtime retrieves the bulletin and the form, then the claims API returns the deductible from Aurora. The answer cites both passages. She then asks to draft a $40,000 payment. Gateway policy denies the tool. A lifecycle hook starts an approval workflow. The model can tell her the draft is waiting. It cannot pay.</p></div>'
    + '<aside class="callout pine"><strong>How to read the diagram</strong><p>Select any service box. The panel explains its job on this path. Open the full brief for the latest behavior, the worked example, and the connections onward.</p></aside>';
}

function categoriesFor(ai) {
  var seen = { All: true };
  var list = ["All"];
  for (var i = 0; i < SERVICES.length; i++) {
    var cat = SERVICES[i].category;
    if (isAi(SERVICES[i]) !== ai) continue;
    if (!seen[cat]) { seen[cat] = true; list.push(cat); }
  }
  return list;
}

function matches(service, query) {
  if (!query) return true;
  var hay = [service.name, service.category, service.summary, service.what, service.scenario, service.example, service.latest, service.security].join(" ").toLowerCase();
  var parts = query.toLowerCase().split(/\s+/);
  for (var i = 0; i < parts.length; i++) if (parts[i] && hay.indexOf(parts[i]) === -1) return false;
  return true;
}

function clip(text, n) {
  if (text.length <= n) return text;
  return text.slice(0, n - 1).trim() + "…";
}

function serviceCard(service) {
  return '<button type="button" class="card clickable" data-open="' + service.id + '"><div class="meta"><span class="tag">' + escapeHtml(service.category) + '</span></div><h4>' + escapeHtml(service.name) + "</h4><p>" + escapeHtml(service.summary) + '</p><p class="latest-line"><span>Latest</span>' + escapeHtml(clip(service.latest, 180)) + "</p></button>";
}

function pairNames(service) {
  var names = [];
  var pairs = service.pairs || [];
  for (var i = 0; i < pairs.length; i++) if (byId[pairs[i]]) names.push(byId[pairs[i]].name);
  return names.join(", ");
}

function workingFlow(service) {
  return [
    ["Enters", service.summary],
    ["Harbor Claims", service.scenario],
    ["Example", service.example],
    ["Leaves toward", pairNames(service) || "the next service in the diagram"]
  ];
}

function renderDetail(service) {
  var pairs = service.pairs || [];
  var links = "";
  for (var i = 0; i < pairs.length; i++) {
    if (!byId[pairs[i]]) continue;
    links += '<button type="button" data-open="' + pairs[i] + '">' + escapeHtml(byId[pairs[i]].name) + "</button>";
  }
  return '<article class="detail prose"><button type="button" class="btn ghost" data-go="' + homeFor(service) + '">Back to ' + (isAi(service) ? "AI services" : "services") + '</button><div class="meta">' + escapeHtml(service.category) + "</div><h2>" + escapeHtml(service.name) + "</h2><p class=\"lede\">" + escapeHtml(service.summary) + "</p>"
    + "<h3>What it is</h3><p>" + escapeHtml(service.what) + "</p>"
    + "<h3>Working flow</h3>" + flowList(workingFlow(service))
    + "<h3>Production example</h3><p>" + escapeHtml(service.example) + "</p>"
    + '<aside class="callout"><strong>Latest update</strong><p>' + escapeHtml(service.latest) + "</p></aside>"
    + "<h3>Reach for it when</h3><ul>" + service.reach.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>"
    + "<h3>Watch</h3><ul>" + service.watch.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>"
    + '<aside class="callout clay"><strong>Security on the connection</strong><p>' + escapeHtml(service.security) + "</p></aside>"
    + "<h3>Connects to</h3><div class=\"links\">" + links + "</div></article>";
}

function renderCatalog(ai) {
  if (state.serviceId && byId[state.serviceId]) return renderDetail(byId[state.serviceId]);
  var cats = categoriesFor(ai);
  if (cats.indexOf(state.category) === -1) state.category = "All";
  var q = state.query.trim();
  var list = [];
  for (var i = 0; i < SERVICES.length; i++) {
    var service = SERVICES[i];
    if (isAi(service) !== ai) continue;
    if (state.category !== "All" && service.category !== state.category) continue;
    if (!matches(service, q)) continue;
    list.push(service);
  }
  var chips = "";
  for (var c = 0; c < cats.length; c++) {
    chips += '<button type="button" class="chip' + (cats[c] === state.category ? " active" : "") + '" data-cat="' + escapeHtml(cats[c]) + '">' + escapeHtml(cats[c]) + "</button>";
  }
  var cards = list.length ? list.map(serviceCard).join("") : '<div class="card empty">No service matches that filter.</div>';
  return { chips: chips, count: list.length, cards: cards, query: q };
}

function renderServices() {
  if (state.serviceId) return renderDetail(byId[state.serviceId]);
  var catalog = renderCatalog(false);
  var wider = WIDER.filter(function (row) {
    if (!catalog.query) return true;
    return (row[0] + " " + row[1]).toLowerCase().indexOf(catalog.query.toLowerCase()) !== -1;
  });
  return ''
    + '<h2 class="page-title">Services</h2>'
    + '<p class="lede">Every load-bearing AWS service around the agent, with the update that changes how you use it. Lambda is the example: response streaming, function URLs, and the Lambda Web Adapter now let a normal web app stream tokens. The same standard — what changed, and the production example — is on every card.</p>'
    + schematic("How the non-AI platform connects", [
      { name: "Publish", ids: ["route53", "cloudfront", "waf", "s3", "acm"] },
      { name: "Enter the account", via: "private network", ids: ["vpc", "privatelink", "apigateway", "cognito", "iam"] },
      { name: "Compute the request", via: "sync or queue", ids: ["lambda", "lambda-web-adapter", "ecs", "fargate", "elb"] },
      { name: "Keep state", via: "encrypted", ids: ["aurora", "dynamodb", "s3", "secrets", "kms"] },
      { name: "React later", via: "events", ids: ["eventbridge", "sqs", "step-functions", "scheduler", "sns"] }
    ])
    + selectedPanel()
    + '<div class="section-h"><h3>Lambda, as the web tier</h3><p>The pattern the rest of the catalog is measured against.</p></div>'
    + flowList([
      ["Framework stays a framework", "FastAPI or Express listens on port 8080. The Lambda Web Adapter translates the Lambda runtime into HTTP. Set AWS_LAMBDA_EXEC_WRAPPER, PORT, and AWS_LWA_INVOKE_MODE=RESPONSE_STREAM."],
      ["Or stream in Node directly", "awslambda.streamifyResponse writes server-sent events as AgentCore produces them. InvokeMode is RESPONSE_STREAM."],
      ["Pick the front door honestly", "API Gateway when you want a JWT authorizer. A function URL behind CloudFront when you need earlier flushes. An internal ALB only for private callers."],
      ["Respect the clock", "Lambda may run 15 minutes. A non-streaming API Gateway integration still dies near 29 seconds. Interactive agents stream, or they become a job."],
      ["Test the real path", "Small SSE writes can buffer until enough bytes accumulate. Measure time-to-first-token through CloudFront, not only on a laptop."]
    ])
    + '<div class="section-h"><h3>' + catalog.count + ' service briefs</h3><p>Latest behavior is on the card. Open one for the flow, the example, and the connections.</p></div>'
    + '<div class="chips">' + catalog.chips + '</div><div class="catalog">' + catalog.cards + "</div>"
    + '<div class="section-h"><h3>Adjacent services</h3><p>In the account, not on the critical path, unless the example says they are.</p></div>'
    + table(["Service", "Where it would connect"], wider.map(function (row) { return row; }));
}

function renderAi() {
  if (state.serviceId) return renderDetail(byId[state.serviceId]);
  var catalog = renderCatalog(true);
  return ''
    + '<h2 class="page-title">AI specific services</h2>'
    + '<p class="lede">The agent is a loop with tools. These services are that loop, the retrieval under it, the policy around it, and the evaluations that decide whether a prompt change ships. Foundation-model calls stay on Bedrock. A custom damage model stays on SageMaker. Document reading stays on Textract, off the chat request.</p>'
    + schematic("Agentic loop", [
      { name: "Turn arrives", ids: ["lambda", "appconfig"], notes: ["Session id from the token subject"] },
      { name: "Runtime and model", via: "invoke", ids: ["agentcore-runtime", "bedrock"] },
      { name: "Tools, governed", via: "tool request", ids: ["agentcore-gateway", "agentcore-policy", "guardrails", "agentcore-identity"] },
      { name: "Grounding and memory", via: "retrieve or write", ids: ["knowledge-bases", "agentcore-memory"] },
      { name: "Irreversible work", via: "deny, then workflow", ids: ["step-functions", "agentcore-tools"] },
      { name: "Learn", via: "after the session", ids: ["agentcore-observability", "agentcore-evaluations", "agent-registry"] }
    ])
    + selectedPanel()
    + '<div class="section-h"><h3>Retrieval flow</h3><p>Managed Knowledge Base, generally available June 2026, is the default RAG path. The model does not search S3 itself.</p></div>'
    + flowList([
      ["Curate", "A worker copies approved policy forms and bulletins into a prefix. Draft folders are not in it."],
      ["Sync", "Connectors pull S3, SharePoint, Confluence, Google Drive, OneDrive, or the web. Ingestion, embeddings, and ranking are managed."],
      ["Ask", "The gateway exposes Retrieve for one search and AgenticRetrieveStream when the question hops across a form and a bulletin."],
      ["Cite", "Passages come back with citations. The UI shows them. The answer is not allowed to drop them."],
      ["Treat as data", "Retrieved text is untrusted. Guardrails on the gateway inspect it before a tool can act on an instruction hidden in a PDF."]
    ])
    + '<div class="section-h"><h3>Payment control flow</h3><p>The tool is a request. The workflow is the payment.</p></div>'
    + flowList([
      ["Model emits draft_payment", "Arguments include claim id and amount. The model does not hold the payment credential."],
      ["Policy evaluates", "Under the threshold and an open claim: a draft is allowed. Over the threshold: deny."],
      ["Hook fires", "A Lambda lifecycle hook returns deny and starts Step Functions. The hook is outside the agent code."],
      ["Human approves", "A senior adjuster calls SendTaskSuccess. A different role submits the payment API."],
      ["Model is told", "The outcome returns as a tool result. The model cannot set the task token itself."]
    ])
    + '<div class="section-h"><h3>What changed through 2026</h3></div>'
    + table(
      ["When", "Service", "What you can do now"],
      [
        ["Jun 2026", "Managed Knowledge Base", "Managed RAG with six connectors and an agentic retriever. Query it from the gateway."],
        ["Jun 2026", "Guardrails in policy", "Block prompt injection and sensitive output at the gateway. Confirm the region; launch was not worldwide."],
        ["Aug 2026", "Agent Registry", "Organization discovery, customer managed keys, PrivateLink, and RAM sharing."],
        ["Oct 2026", "Memory", "TTL on long-term records. Short-term memory billed on consumption. JSON events and direct long-term ingest landed in August."],
        ["Oct 2026", "Gateway", "Private CA trust for MCP, OpenAPI, and HTTP targets, including VPC Lattice."],
        ["Oct 2026", "Evaluations", "Failure analysis clusters broken sessions and suggests prompt or tool fixes. TypeScript frameworks included."],
        ["Oct 2026", "Harness", "Interactive shells and Lambda allow/deny hooks. Do not attach a shell to the claims agent."]
      ]
    )
    + '<div class="section-h"><h3>' + catalog.count + ' AI briefs</h3><p>Open a service for its flow and the production example.</p></div>'
    + '<div class="chips">' + catalog.chips + '</div><div class="catalog">' + catalog.cards + "</div>";
}

function renderPipeline() {
  return ''
    + '<h2 class="page-title">Deployment pipeline</h2>'
    + '<p class="lede">Accounts and keys exist before the first prompt. A merged pull request is the only way into production. The diagram is the release, from git to a canary that expects a citation.</p>'
    + schematic("Pipeline diagram", [
      { name: "Source", ids: [], notes: ["Pull request", "CDK app", "Agent image", "Prompt in AppConfig"] },
      { name: "Prove the change", via: "build", ids: ["codepipeline", "codebuild", "inspector"] },
      { name: "Publish artifacts", via: "digest, not a floating tag", ids: ["ecr", "cdk", "cloudformation"] },
      { name: "Dev account", via: "auto deploy", ids: ["lambda", "agentcore-runtime", "appconfig"] },
      { name: "Decision", via: "someone who cannot push code", ids: [], notes: ["Manual approval", "IAM diff read by a human"] },
      { name: "Prod account", via: "change set", ids: ["codepipeline", "codedeploy", "cloudwatch"] },
      { name: "Confirm", via: "after traffic", ids: ["scheduler", "agentcore-evaluations"], notes: ["Synthetic canary", "AppConfig bake", "Rollback digest"] }
    ])
    + '<div class="section-h"><h3>Working flow</h3></div>'
    + flowList([
      ["Land the organization", "Control Tower vends security, log-archive, network, shared-services, claims-dev, and claims-prod. SCPs deny unused regions only after you confirm the agent features exist in the regions you keep."],
      ["Turn on evidence", "Organization CloudTrail, GuardDuty, Config, Security Hub, and budgets exist before a model is called. CMKs are split: claims, databases, logs, registry."],
      ["Network, then data", "Private subnets, S3 and DynamoDB gateway endpoints, interface endpoints for Bedrock and AgentCore. Aurora and the claims API deploy before any agent exists."],
      ["Build in a clean project", "CodeBuild runs tests, policy-deny cases, and the container build. The build role can push to ECR. It cannot register a production runtime."],
      ["Scan and pin", "Inspector scans the image. Promotion uses the digest. Mutable tags are off."],
      ["Diff", "CDK synths a change set. A reviewer looks at IAM and anything that can replace Aurora or the claims bucket."],
      ["Dev", "The stack, the runtime, and the prompt deploy to claims-dev. Streaming is tested through the same CloudFront path prod will use."],
      ["Approve", "A role that cannot author the pull request approves prod."],
      ["Prod, then bake", "The previous image digest stays in ECR. AppConfig rolls the prompt to a slice of sessions. The canary logs in and expects a citation."],
      ["Rollback is two levers", "Prompt rollback is the previous AppConfig version. Code rollback is the previous digest. Neither is a console edit."]
    ])
    + '<div class="section-h"><h3>Example release of a prompt and a tool</h3></div>'
    + '<div class="prose"><p>The team changes the retrieve tool description so bulletins are in scope, and tightens the payment threshold from $5,000 to $2,500. Both changes are in git: the tool text in the image, the threshold in AppConfig. The pipeline’s policy test asserts that $3,000 is denied. Dev gets the image. A reviewer reads the IAM diff, which did not grow. Prod shifts the ECS claims API with CodeDeploy blue/green, registers the new runtime digest, and bakes the threshold to 10% of sessions. Failure analysis the next morning either confirms fewer missed citations or the bake stops.</p></div>'
    + '<pre><code># Pipeline steps. Not a laptop ritual.\ncdk diff\n# human reads IAM and any resource replacement\ncdk deploy claims-dev\n# image scan + payment-deny tests must pass\n# manual approval by a non-author\ncdk deploy claims-prod\n# AppConfig bake, then the citation canary</code></pre>'
    + '<div class="section-h"><h3>Rollback flow</h3></div>'
    + flowList([
      ["Canary fails or evals drop", "Stop the AppConfig bake. Do not debug in the prod console."],
      ["Prompt was the change", "Deploy the previous configuration version. The image stays."],
      ["Image was the change", "Point the runtime at the previous digest. CodeDeploy shifts the API back if its health check failed."],
      ["Data was the change", "Restore Aurora to a new cluster name from the backup vault. Do not overwrite the damaged one until forensics is done."]
    ])
    + '<aside class="callout clay"><strong>Region honesty</strong><p>Guardrails-in-policy did not launch in every region. A second region is a diagram you may draw only after the runtime, the knowledge base, and Aurora are all actually runnable there. Until then, practice a DNS maintenance page and a database restore.</p></aside>';
}

function renderScale() {
  return ''
    + '<h2 class="page-title">Scalability</h2>'
    + '<p class="lede">Harbor Claims is quiet on a Tuesday and slammed the week after a hailstorm. Each tier scales in a different unit. The diagram shows the unit, the buffer in front of it, and the ceiling you set on purpose.</p>'
    + schematic("Scale path under a storm", [
      { name: "Absorb at the edge", via: "cache what is static", ids: ["cloudfront", "waf"], notes: ["Assets cached", "Chat path not cached", "Rate limit before tokens"] },
      { name: "Protect the account", via: "throttle", ids: ["apigateway", "lambda"], notes: ["Provisioned concurrency for first token", "Reserved concurrency as a quota shield"] },
      { name: "Buffer the burst", via: "queue", ids: ["sqs", "eventbridge", "fargate"], notes: ["8,000 photos enqueue", "Workers scale to the Textract budget"] },
      { name: "Scale data", via: "measured", ids: ["aurora", "dynamodb", "s3"], notes: ["Aurora 2 to N ACU", "DynamoDB on-demand", "S3 has no capacity to set"] },
      { name: "Scale the agent", via: "invocations", ids: ["agentcore-runtime", "bedrock", "knowledge-bases"], notes: ["Pin max tokens", "Budget alarm the same day"] },
      { name: "Stay up in one region", via: "multi-AZ", ids: ["elb", "aurora", "nat"], notes: ["Two NAT gateways", "Not two regions until the agent is real in both"] }
    ])
    + '<div class="section-h"><h3>Working flow on hail week</h3></div>'
    + flowList([
      ["8,000 photos arrive in an hour", "The upload API writes to a quarantine prefix and sends a pointer to SQS. The HTTP call returns. It does not wait for Textract."],
      ["WAF sheds the script", "A client retrying chat 40 times in ten seconds is blocked at CloudFront. Bedrock never sees it."],
      ["Chat stays responsive", "Provisioned concurrency keeps the BFF warm. Reserved concurrency on the extractor stops it from consuming the account’s Lambda limit."],
      ["The claims API scales on requests", "Fargate tasks behind the internal ALB scale on in-flight requests. Aurora Serverless v2 moves between a floor of 2 ACU and a ceiling you load-tested."],
      ["The agent does not fan out blindly", "Each turn is one runtime invocation with a bounded tool list. Similar-claims returns aggregates, not ten thousand rows."],
      ["Money still waits", "More volume does not loosen the payment policy. Step Functions approvals queue. They do not auto-approve."],
      ["You see the ceiling", "Alarms: 5xx, queue age, DLQ depth, time to first token, Aurora ACU pinned, policy denies, and the Bedrock budget."]
    ])
    + '<div class="section-h"><h3>What actually scales, and the knob</h3></div>'
    + table(
      ["Tier", "Scales by", "Set a ceiling because", "Example"],
      [
        ["CloudFront", "Edge capacity, cache hit rate", "Caching the chat POST would serve another adjuster’s answer", "Cache GET assets for a day. Cache POST /chat never."],
        ["WAF and API Gateway", "Request rate", "A retry storm becomes a token bill", "Per-IP limit plus a stage throttle. Corporate NATs need a second key, not only IP."],
        ["Lambda BFF", "Concurrency", "Cold starts blow the first-token budget; unlimited concurrency starves other functions", "Provisioned concurrency on the BFF. Reserved concurrency on extractors."],
        ["SQS and Fargate workers", "Queue depth and task count", "Textract and Bedrock quotas are finite", "Visibility timeout longer than the job. DLQ after five receives."],
        ["Aurora Serverless v2", "ACUs", "Min ACU is a 24/7 cost; max ACU is the storm ceiling", "Floor 2 ACU. Ceiling from a load test, not from hope."],
        ["DynamoDB", "On-demand or provisioned", "A hot partition on one claim id stalls the rest", "Conversation key is adjuster plus conversation, not a single status."],
        ["AgentCore and Bedrock", "Invocations and tokens", "A nightly eval can cost more than the day’s chats", "Max tokens pinned. Eval schedule has its own budget."],
        ["Knowledge base", "Managed retrieval", "A full-drive sync makes retrieval slower and less safe", "Sync the curated prefix. Do not index the working share."]
      ]
    )
    + '<div class="section-h"><h3>Multi-AZ is not multi-region</h3></div>'
    + '<div class="prose"><p>The internal load balancer, Aurora, and NAT span Availability Zones so one data-center loss is a degrade, not an outage. A second region requires the runtime, the knowledge base, the model, and the database to exist there. Until that is true, scalability work is: endpoints so model traffic skips NAT, a queue in front of extraction, concurrency limits, and a rehearsed restore. Adding instances does not fix a tool that returns too much data.</p></div>'
    + '<aside class="callout pine"><strong>The bill is a scale signal</strong><p>If NAT grows with token volume, the VPC endpoints are missing. If Bedrock grows on a Tuesday night, the evaluation schedule is unbounded. Tag the workload and alarm on those two usage types the day you launch, not at invoice time.</p></aside>'
    + '<div class="section-h"><h3>Example capacity for the pilot</h3></div>'
    + table(
      ["Load", "Design response", "Signal you sized it wrong"],
      [
        ["200 adjusters, office hours", "On-demand Lambda, Aurora floor 2 ACU, one Fargate task minimum", "First token past the SLO every morning"],
        ["Storm week, 8,000 uploads", "SQS, reserved extractor concurrency, Textract async", "DLQ depth or API timeouts on upload"],
        ["A bad prompt in 10% bake", "AppConfig bake plus nightly failure analysis", "Deny rate or citation score drops and nobody is paged"],
        ["One poisoned PDF", "Gateway guardrail, no arbitrary HTTP tool", "The agent calls a new destination; Network Firewall should already have dropped it"]
      ]
    );
}

function render() {
  parseHash();
  var view = document.getElementById("view");
  var y = state.keepScroll ? window.scrollY : 0;
  var html = "";
  if (state.route === "architecture") html = renderArchitecture();
  else if (state.route === "services") html = renderServices();
  else if (state.route === "ai") html = renderAi();
  else if (state.route === "pipeline") html = renderPipeline();
  else html = renderScale();
  html += '<p class="fine">Cloudamic is an architecture brief. Service behavior, regional availability, and prices change. The 2026 notes follow the Amazon Bedrock AgentCore release notes through October 2026 and the Managed Knowledge Base and Guardrails announcements from June 2026. Confirm the current AWS documentation before you depend on a feature.</p>';
  view.innerHTML = html;
  var tabs = document.querySelectorAll(".tabs button");
  for (var t = 0; t < tabs.length; t++) {
    if (tabs[t].getAttribute("data-go") === state.route) tabs[t].setAttribute("aria-current", "page");
    else tabs[t].removeAttribute("aria-current");
  }
  var search = document.getElementById("search");
  if (document.activeElement !== search && state.route !== "services" && state.route !== "ai") {
    /* keep the typed query only while browsing catalogs */
  }
  if (state.keepScroll) window.scrollTo(0, y);
  else {
    window.scrollTo(0, 0);
    if (document.activeElement !== document.getElementById("search")) view.focus();
  }
  state.keepScroll = false;
}

function searchHits(query) {
  var q = query.trim().toLowerCase();
  if (!q) return [];
  var hits = [];
  for (var i = 0; i < SERVICES.length; i++) {
    var service = SERVICES[i];
    var hay = (service.name + " " + service.category + " " + service.summary + " " + service.latest).toLowerCase();
    if (hay.indexOf(q) !== -1) hits.push(service);
    if (hits.length === 8) break;
  }
  return hits;
}

function renderSearch() {
  var box = document.getElementById("search-results");
  var input = document.getElementById("search");
  var hits = searchHits(input.value);
  if (!input.value.trim() || document.activeElement !== input) {
    box.hidden = true;
    box.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    return;
  }
  box.hidden = false;
  input.setAttribute("aria-expanded", "true");
  if (!hits.length) {
    box.innerHTML = '<div class="empty">No service matches.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < hits.length; i++) {
    html += '<button type="button" data-open="' + hits[i].id + '"><span>' + escapeHtml(hits[i].name) + "</span><small>" + escapeHtml(hits[i].category) + "</small></button>";
  }
  box.innerHTML = html;
}

document.body.addEventListener("click", function (event) {
  var open = event.target.closest("[data-open]");
  if (open) {
    var service = byId[open.getAttribute("data-open")];
    if (!service) return;
    document.getElementById("search-results").hidden = true;
    go(homeFor(service), service.id);
    return;
  }
  var dest = event.target.closest("[data-go]");
  if (dest) {
    state.category = "All";
    go(dest.getAttribute("data-go"));
    return;
  }
  var node = event.target.closest("[data-node]");
  if (node) {
    state.selected = node.getAttribute("data-node");
    state.keepScroll = true;
    render();
    return;
  }
  var cat = event.target.closest("[data-cat]");
  if (cat) {
    state.category = cat.getAttribute("data-cat");
    state.keepScroll = true;
    render();
  }
});

var searchInput = document.getElementById("search");
searchInput.addEventListener("input", function () {
  state.query = searchInput.value;
  renderSearch();
  if (state.route === "services" || state.route === "ai") {
    state.keepScroll = true;
    render();
    searchInput.focus();
  }
});
searchInput.addEventListener("focus", renderSearch);
searchInput.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    document.getElementById("search-results").hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("click", function (event) {
  if (!event.target.closest(".search")) {
    document.getElementById("search-results").hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "#/architecture";
else render();
