                  {pwError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs sm:text-sm text-[#9B1C4E]">
                      {pwError}
                    </div>
                  )}
                  {pwMsg && (
                    <div className="p-3 rounded-xl bg-[#FDF2F6] border border-rose-200 text-xs sm:text-sm text-[#A81E58] font-medium">
                      {pwMsg}
                    </div>
                  )}

                  {hasPasswordProvider ? (
                    <form onSubmit={handleChangePassword} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.currentPassword}
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.newPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                          {t.admin.securityPanel.confirmPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={pwBusy}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
                      >
                        {t.admin.securityPanel.updatePasswordButton}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-[#6B4E5C] leading-relaxed">
                        {t.admin.securityPanel.googleAccountNotice}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user.email) return;
                          try {
                            await sendPasswordResetEmail(auth, user.email);
                            setPwMsg(t.admin.resetSent);
                          } catch (err) {
                            setPwError(formatAuthError(err));
                          }
                        }}
                        className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#FDF2F6] text-[#C92A6D] border border-rose-200 cursor-pointer min-h-10"
                      >
                        {t.admin.securityPanel.sendResetEmail}
                      </button>
                    </div>
                  )}
                </div>

                {user.uid === OWNER_UID && <form
                  onSubmit={handleSaveInviteEmail}
                  className="rounded-2xl bg-white border border-rose-200 p-6 space-y-4"
                >
                  <h2 className="font-display text-xl font-semibold text-[#2D1B24]">
                    {t.admin.securityPanel.inviteHeading}
                  </h2>
                  <p className="text-sm text-[#6B4E5C] leading-relaxed">
                    {t.admin.securityPanel.inviteHelp}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#5E4451] mb-1">
                      {t.admin.securityPanel.inviteEmailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-rose-200 text-sm"
                    />
                  </div>

                  {inviteMsg && (
                    <p className="text-sm font-medium text-[#A81E58]">
                      {inviteMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#C92A6D] text-white hover:bg-[#A81E58] cursor-pointer min-h-11"
                  >
                    {t.admin.securityPanel.saveInviteButton}
                  </button>
                </form>}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
