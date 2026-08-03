import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  CornerUpLeft,
  Database,
  Flag,
  GitBranch,
  PlayCircle,
  RotateCcw,
  Table2,
} from 'lucide-react';
import styles from './VariablesConnectionGraphHelpModal.module.scss';

const ExcelGotoHelpGraph: React.FC = () => (
  <div className={styles.graphWorkspace}>
    <section className={styles.graphCard} aria-label="EXCEL GOTO flow graph">
      <div className={styles.graphHeading}>
        <div>
          <span>Dataset loop</span>
          <h3>One Excel row drives one complete use-case pass</h3>
        </div>
        <strong>One active EXCEL GOTO per Bot Job</strong>
      </div>

      <div className={styles.horizontalFlow}>
        <article className={`${styles.flowNode} ${styles.startNode}`}>
          <PlayCircle size={20} aria-hidden="true" />
          <b>Start / Rerun</b>
          <small>Begin at the first configured Block</small>
        </article>
        <ArrowRight className={styles.arrow} aria-hidden="true" />
        <article className={`${styles.flowNode} ${styles.dataNode}`}>
          <Table2 size={20} aria-hidden="true" />
          <b>Load current Excel row</b>
          <small>Copy exact raw values into runtime memory</small>
        </article>
        <ArrowRight className={styles.arrow} aria-hidden="true" />
        <article className={`${styles.flowNode} ${styles.actionNode}`}>
          <RotateCcw size={20} aria-hidden="true" />
          <b>Return Block</b>
          <small>Execute the controlled Block/use-case scope</small>
        </article>
        <ArrowRight className={styles.arrow} aria-hidden="true" />
        <article className={`${styles.flowNode} ${styles.commandNode}`}>
          <Database size={20} aria-hidden="true" />
          <b>EXCEL GOTO</b>
          <small>Evaluate the dataset row cursor</small>
        </article>
      </div>

      <ArrowDown className={styles.downArrow} aria-hidden="true" />

      <div className={styles.decisionFlow}>
        <article className={`${styles.flowNode} ${styles.decisionNode}`}>
          <GitBranch size={20} aria-hidden="true" />
          <b>More rows?</b>
          <small>Check whether another Excel data row exists</small>
        </article>

        <div className={styles.branchColumn}>
          <span className={`${styles.branchBadge} ${styles.yesBadge}`}>YES</span>
          <article className={`${styles.flowNode} ${styles.dataNode}`}>
            <Table2 size={20} aria-hidden="true" />
            <b>Advance row</b>
            <small>Load the next row and update runtime memory</small>
          </article>
          <div className={styles.returnPath}>
            <CornerUpLeft size={18} aria-hidden="true" />
            Jump to Return Block
          </div>
        </div>

        <div className={styles.branchColumn}>
          <span className={`${styles.branchBadge} ${styles.noBadge}`}>NO</span>
          <article className={`${styles.flowNode} ${styles.endNode}`}>
            <Flag size={20} aria-hidden="true" />
            <b>End Block</b>
            <small>Leave the controlled scope after the final row</small>
          </article>
          <div className={styles.completePath}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Dataset loop complete
          </div>
        </div>
      </div>
    </section>

    <aside className={styles.explanationCard}>
      <h3>Execution guarantees</h3>
      <ol>
        <li>The first pass uses the first Excel row.</li>
        <li>Every additional row reloads memory before the Return Block runs.</li>
        <li>The final row reaches the End Block exactly once.</li>
        <li>Currency, date, decimal, locale, and empty text remain unchanged.</li>
      </ol>
    </aside>
  </div>
);

export default ExcelGotoHelpGraph;
