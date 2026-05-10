What's the next functional step on the Functional Test tab?                               
                                                                                                                                                                           
❯ 1. Persist mappings to the scanner DB (Recommended)                                                                                                                      
     Add a use_case_field_mapping table + Java save/load + a 💾 Save button on the tab. Mappings survive across machines / users / clean installs. ~1 day. Unlocks         
     everything else — you can't run or report on what isn't persisted.                                                                                                    
  2. Run the mapping: feed mapped values into a real test                                                                                                                
     Add a ▶ Run button: for each mapping, take the API spec field's example/synth value, write it into the bot-job INPUT instruction's payload, dispatch one execution.
     Visible result. ~2-3 days. Skips persistence — but the demo lands faster.
  3. Output side: add bot-job O:* on the right and capture-into-API on the left
     Currently right side is INPUT only. Add an OUTPUT panel that maps bot-job output fields (O:*) to API response fields (readOnly). Closes the loop for assertion
     testing. ~2 days.
  4. Drag-and-drop instead of click-to-pair
     Cosmetic UX upgrade. Same data model, fancier interaction. ~half day. Defer until the data plumbing is real.
  5. Type something.