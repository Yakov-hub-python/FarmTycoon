const vip = require('./vip')
const time = require('./time')

function getReferralLink(userId, botUsername='FarmTycoonGameBot' ) {
    return `https://t.me/${botUsername}?start=ref_${userId}`
}

function processReferral(newUser, inviter, inviterReward = 5000, newUserReward = 1500) {
    if (newUser.id === inviter.id) return { ok: false, error: 'self_referral' }
    if (newUser.referredBy) return { ok: false, error: 'already_referred' }
    if(time.now() - newUser.createdAt > 60) return { ok: false, error: 'already_playing'}
    if(newUser.createdAt > inviter.createdAt) return {ok: false, error: 'invalid_timing'}
    newUser.referredBy = inviter.id
    inviter.coin += inviterReward
    inviter.referralCount += 1
    if(inviter.referralCount % 3 === 0) {
        vip.addVipDays(inviter, 7, 'referral_bonus')
    }
    newUser.coin += newUserReward
    return { ok: true, inviterReward, newUserReward }
}

module.exports = { getReferralLink, processReferral }