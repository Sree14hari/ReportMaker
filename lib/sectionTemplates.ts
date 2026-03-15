// lib/sectionTemplates.ts
import { SectionType } from './reportTypes';

interface SectionTemplate {
  defaultTitle: string;
  defaultContent: string;
}

export const sectionTemplates: Record<SectionType, SectionTemplate> = {
  'title-page': {
    defaultTitle: 'Title Page',
    defaultContent: '',
  },
  'certificate': {
    defaultTitle: 'Certificate',
    defaultContent: `<p>This is to certify that the {{subtitle}} entitled <strong>"{{title}}"</strong> submitted by <strong>{{studentNames}}</strong> to the {{universityName}} in partial fulfilment of the requirements for the award of the Degree of {{degree}} in {{branch}} is a bonafide record of the project work carried out by them under our guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.</p>`,
  },
  'declaration': {
    defaultTitle: 'Declaration',
    defaultContent: `<p>We hereby declare that the project report entitled <strong>"{{title}}"</strong> submitted in partial fulfillment of the requirements for the award of the degree of <strong>{{degree}}</strong> in <strong>{{branch}}</strong> from <strong>{{universityName}}</strong> is a record of original and independent work done by us during 2023-24 under the supervision and guidance of <strong>{{guideName}}</strong>, <strong>{{guideDesignation}}</strong>, Department of <strong>{{department}}</strong>, <strong>{{collegeName}}</strong>.</p><p>We further declare that the work reported in this project has not been submitted and will not be submitted, either in part or in full, for the award of any other degree or diploma in this institute or any other institute or university.</p>`,
  },
  'acknowledgement': {
    defaultTitle: 'Acknowledgement',
    defaultContent: `<p>We express our sincere gratitude to our respected principal <strong>{{principalName}}</strong>, for his valuable support and advice. We express our sincere thanks to <strong>{{hodName}}</strong>, {{hodDesignation}}, Department of {{department}} for coordinating us throughout our mini project for her valuable guidance and suggestions throughout the mini project work. We would like to thank with deep sense of gratitude and obligation to our mini project guide, <strong>{{guideName}}</strong>, Department of {{department}}, {{collegeName}} for her guidance and mentoring throughout our mini project work. We express our sincere gratitude to all the members of the Department of {{department}}, {{collegeName}}, for their encouragement and valuable assistance. In particular, we are thankful to all those who have helped us directly or indirectly in completing the mini project work. Above all we thank Almighty for giving us the health and strength to complete the work on time.</p>
{{studentListRightAligned}}`,
  },
  'abstract': {
    defaultTitle: 'Abstract',
    defaultContent: `<p>This project presents the design, development, and implementation of [describe your project here]. The system aims to [objective]. The methodology employed involves [brief description of methods].</p><p>The results demonstrate that [key findings]. This work contributes to [broader impact or field].</p><p><strong>Keywords:</strong> [keyword1], [keyword2], [keyword3]</p>`,
  },
  'table-of-contents': {
    defaultTitle: 'Table of Contents',
    defaultContent: '',
  },
  'list-of-figures': {
    defaultTitle: 'List of Figures',
    defaultContent: `<table style="min-width: 100px;"><tbody><tr><th colspan="1" rowspan="1"><p style="text-align: center"><strong>FIG No.</strong></p></th><th colspan="1" rowspan="1"><p style="text-align: center"><strong>TITLE</strong></p></th><th colspan="1" rowspan="1"><p style="text-align: center"><strong>PAGE No.</strong></p></th></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center">3.1</p></td><td colspan="1" rowspan="1"><p style="text-align: center">Block diagram</p></td><td colspan="1" rowspan="1"><p style="text-align: center">8</p></td></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center">3.2</p></td><td colspan="1" rowspan="1"><p style="text-align: center">Circuit diagram</p></td><td colspan="1" rowspan="1"><p style="text-align: center">10</p></td></tr></tbody></table>`,
  },
  'list-of-tables': {
    defaultTitle: 'List of Tables',
    defaultContent: `<table style="min-width: 100px;"><tbody><tr><th colspan="1" rowspan="1"><p style="text-align: center"><strong>TABLE No.</strong></p></th><th colspan="1" rowspan="1"><p style="text-align: center"><strong>TITLE</strong></p></th><th colspan="1" rowspan="1"><p style="text-align: center"><strong>PAGE No.</strong></p></th></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center">4.1</p></td><td colspan="1" rowspan="1"><p style="text-align: center">Hardware Components</p></td><td colspan="1" rowspan="1"><p style="text-align: center">12</p></td></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center">5.1</p></td><td colspan="1" rowspan="1"><p style="text-align: center">Experimental Results</p></td><td colspan="1" rowspan="1"><p style="text-align: center">19</p></td></tr></tbody></table>`,
  },
  'chapter': {
    defaultTitle: 'Chapter',
    defaultContent: `<h2>Introduction</h2><p>This chapter provides an overview of the project, including the background, motivation, objectives, and the scope of the work.</p><h2>Background</h2><p>[Provide background context here]</p><h2>Objectives</h2><p>[List the objectives of the project]</p><h2>Scope</h2><p>[Describe the scope of the project]</p>`,
  },
  'results': {
    defaultTitle: 'Results and Discussion',
    defaultContent: `<h2>Results</h2><p>This chapter presents the experimental results obtained during the project. The results are analyzed and discussed in detail.</p><h2>Discussion</h2><p>[Discuss the results and their significance here]</p>`,
  },
  'advantages-disadvantages': {
    defaultTitle: 'Advantages and Disadvantages',
    defaultContent: `<h2>Advantages</h2><ul><li>[Advantage 1]</li><li>[Advantage 2]</li><li>[Advantage 3]</li></ul><h2>Disadvantages</h2><ul><li>[Disadvantage 1]</li><li>[Disadvantage 2]</li></ul>`,
  },
  'conclusion': {
    defaultTitle: 'Conclusion and Future Scope',
    defaultContent: `<h2>Conclusion</h2><p>This project successfully implemented [describe outcome]. The system achieved [key accomplishments] demonstrating [significance].</p><h2>Future Scope</h2><p>The following enhancements can be considered for future work:</p><ul><li>[Future enhancement 1]</li><li>[Future enhancement 2]</li><li>[Future enhancement 3]</li></ul>`,
  },
  'references': {
    defaultTitle: 'References',
    defaultContent: `<p>[1] Author, A. A., &amp; Author, B. B. (Year). Title of work. Publisher.</p><p>[2] Author, C. C. (Year). Title of article. <em>Journal Name</em>, <em>Volume</em>(Issue), Page–Page. https://doi.org/xxxxx</p><p>[3] Author, D. D. (Year). <em>Title of webpage</em>. Retrieved from https://www.example.com</p>`,
  },
};
