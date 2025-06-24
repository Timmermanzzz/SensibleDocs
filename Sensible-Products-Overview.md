Sensible Products Overview

Sensible Live Extension

Sensible Live – Product Overview
Sensible Live is a real-time browser extension that helps users detect and manage sensitive information while typing, especially in tools like ChatGPT, CoPilot, or Gemini but the scope will expand to 'Everywhere you share'. 

The extension runs in Chrome and Edge, it works instantly, and gives users control over what is shared — without disrupting their workflow.

This document outlines the core UX features of the extension, as well as the underlying AI capabilities that power detection, masking, and performance. It also covers shared components used across both Sensible Live and Sensible Docs, where relevant.

Core UX
The Sensible Live extension is designed to be always present, but never in the way. Its interface is lightweight, responsive, and focused on clarity. The sidebar surfaces detection results in real time and gives users direct control, without interrupting their workflow. Below are the key interaction elements that define the experience.

- Draggable sidebar that can be positioned on a Y-axis
- Buttons for Detection, Documents, Feedback, and Settings
- Real-time badge showing number of detected sensitive items
- Sidebar updates automatically based on detection results

Detection panel
- List of detected items with name, type, confidence score, and masking toggle
- TODO; make the list of PII entities
- Buttons to "Mask all" and "Unmask all" items
- Per-item toggle to turn masking on or off
- Apply button to confirm and apply selected masks

States:
- State: Logged in and items detected
- State: logged in but no items detected (Educational empty state)
- State: Logged out and items detected
- State: logged in, auto-mask is enabled in settings

Documents panel
- Scrollable list of previously processed documents with name, size, and timestamp
- Upload button to add a new document
- Quick access button to open the dashboard
- View button to inspect individual documents
- Apply button to confirm and apply selected masks

States:
- State: Logged in and items detected
- State: logged in but no docs processed (Educational empty state)
- State: Logged out

Feedback Panel
- Star rating input (1 to 5) to rate the experience
- Free text field for comments, suggestions, or bug reports
- Possibility to add an image/screenshot
- Submit button to send feedback
- Cancel button to close the panel

Settings Panel
- Auto-mask toggle: Automatically mask detected sensitive data
- Theme selection: Buttons: Light (active), Dark, Auto
- Account section
- Button: View Dashboard (with external link icon)
- Button: Logout (red) (if logged in)
- Footer actions
- Button: Close
- Button: Save Changes (primary)

States:
- State: Logged in
- State: Logged out

TODO: Reporting in sensible live dashboards and how to combine with docs

---

Sensible Docs

Sensible Docs – Product Overview
Sensible Docs is a comprehensive document anonymization platform designed for organizations that need to process, review, and share sensitive documents safely. The platform automatically detects personally identifiable information (PII) and other sensitive data across multiple document formats, enabling users to maintain privacy compliance while sharing necessary information.

Unlike real-time detection tools, Sensible Docs is built for thorough document processing workflows — from bulk upload and AI-powered analysis to manual review and controlled export. It serves various use cases including legal document review, compliance reporting, research data sharing, HR document processing, and government transparency initiatives.

The platform combines enterprise-grade security with an intuitive interface, making document anonymization accessible to both technical and non-technical users across organizations of all sizes.

Core UX
Sensible Docs follows a project-based workflow that guides users through the complete document anonymization process. The interface is designed for efficiency and control, allowing users to handle everything from single documents to large batches while maintaining full oversight of the anonymization process.

Project Management Dashboard
- Project Overview Cards: Visual representation of active projects with progress indicators, deadlines, and key metrics
- Quick Actions: Direct access to common tasks like creating new projects, uploading documents, or accessing recent work
- Statistics Panel: Real-time metrics showing processing volumes, success rates, and system performance
- Recent Activity Feed: Live updates on document processing, user actions, and system events

Document Upload Interface
- Drag & Drop Zone: Intuitive file upload supporting multiple formats (PDF, Word, TXT, etc.)
- Batch Processing: Ability to upload and process multiple documents simultaneously
- Profile Selection: Choose from pre-configured anonymization profiles or create custom settings
- Progress Tracking: Real-time progress indicators for upload and processing status
- File Validation: Automatic format checking and size validation with clear error messaging

AI Processing Engine
- Real-time Processing: Documents are analyzed immediately upon upload using advanced NLP models
- Multi-language Support: Detection capabilities across 50+ languages with high accuracy
- Confidence Scoring: Each detected PII item includes confidence levels to guide review decisions
- Entity Classification: Automatic categorization of detected information (names, emails, addresses, phone numbers, etc.)

Review & Approval Workflow
- Document Viewer: Integrated PDF and document viewer with PII highlighting and annotation
- Side-by-Side Comparison: Toggle between original and anonymized versions
- Item-by-Item Review: Detailed panel showing all detected PII with approve/reject controls
- Bulk Actions: Ability to approve or reject multiple items based on type, confidence, or other criteria
- Custom Masking: Options to modify anonymization text or create custom replacement patterns

Export & Sharing Controls
- Multiple Export Formats: Generate anonymized documents in various formats
- Audit Trail Generation: Automatic creation of processing reports and audit logs
- Controlled Access: Permission-based sharing with expiration dates and access tracking
- Version Management: Maintain original, anonymized, and reviewed versions with clear labeling

Key Features

Enterprise Security
- Role-based Access Control: Granular permissions for different user types and responsibilities
- Audit Logging: Comprehensive tracking of all user actions and system events
- Data Encryption: End-to-end encryption for documents in transit and at rest
- Compliance Framework: Built-in support for GDPR, HIPAA, and other privacy regulations

AI-Powered Detection
- BERT-based Models: State-of-the-art natural language processing for accurate PII detection
- Contextual Understanding: Advanced algorithms that understand context to reduce false positives
- Continuous Learning: Models that improve over time based on user feedback and corrections
- Custom Entity Recognition: Ability to train the system on organization-specific sensitive information

Workflow Automation
- Processing Profiles: Pre-configured settings for different document types and use cases
- Batch Operations: Automated processing of large document sets with minimal user intervention
- Integration APIs: RESTful APIs for connecting with existing document management systems
- Scheduled Processing: Ability to set up recurring anonymization tasks

Use Cases

Legal & Compliance
- Discovery Document Review: Anonymize sensitive client information in legal discovery materials
- Regulatory Reporting: Prepare compliance reports while protecting individual privacy
- Contract Redaction: Remove sensitive terms and personal data from contracts before sharing

Government & Public Sector
- Freedom of Information Requests: Process government documents for public release
- Policy Document Sharing: Share internal policy documents while protecting citizen privacy
- Inter-agency Collaboration: Enable secure document sharing between government departments

Healthcare & Research
- Medical Record Sharing: Anonymize patient records for research or second opinions
- Clinical Trial Documentation: Prepare research materials while maintaining participant privacy
- Insurance Processing: Process claims documents while protecting patient confidentiality

Corporate & HR
- Employee Record Management: Handle HR documents while protecting personal information
- Vendor Document Sharing: Share operational documents with external partners safely
- Internal Audit Preparation: Prepare audit materials while protecting sensitive business information

Academic & Research
- Research Data Sharing: Anonymize datasets for academic collaboration and publication
- Student Record Processing: Handle educational records while maintaining student privacy
- Grant Application Preparation: Prepare funding applications while protecting proprietary information

Integration Capabilities

Document Management Systems
- SharePoint Integration: Direct integration with Microsoft SharePoint environments
- Google Workspace: Seamless workflow with Google Drive and Google Docs
- Box & Dropbox: Cloud storage integration for automated document processing

Enterprise Software
- CRM Systems: Integration with Salesforce, HubSpot, and other customer management platforms
- ERP Integration: Connect with SAP, Oracle, and other enterprise resource planning systems
- Workflow Automation: Zapier, Microsoft Power Automate, and custom API integrations

Security & Compliance Tools
- SIEM Integration: Security information and event management system connectivity
- DLP Solutions: Integration with data loss prevention tools and policies
- Identity Management: SSO integration with Active Directory, Okta, and other identity providers

Technical Architecture

Scalable Infrastructure
- Cloud-Native Design: Built for horizontal scaling and high availability
- Docker Containerization: Consistent deployment across different environments
- Load Balancing: Automatic traffic distribution for optimal performance

Performance Optimization
- Asynchronous Processing: Non-blocking document processing for improved user experience
- Caching Strategies: Intelligent caching for faster document retrieval and processing
- Resource Management: Efficient memory and CPU utilization for large document processing

Monitoring & Analytics
- Real-time Dashboards: Live monitoring of system performance and usage metrics
- Processing Analytics: Detailed insights into anonymization patterns and effectiveness
- User Behavior Tracking: Understanding of user workflows for continuous improvement 